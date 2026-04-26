import { id, addonType } from "../../config.caw.js";
import AddonTypeMap from "../../template/addonTypeMap.js";

// ── Module-scope constants ──────────────────────────────────────────────────
const _2pi = 2 * Math.PI;

// Sin lookup table — 16 KB, shared across all instances, built once on load.
const SIN_TABLE_SIZE = 4096;
const SIN_TABLE = new Float32Array(SIN_TABLE_SIZE);
for (let i = 0; i < SIN_TABLE_SIZE; i++) {
  SIN_TABLE[i] = Math.sin((i / SIN_TABLE_SIZE) * _2pi);
}

// Linearly-interpolated sine lookup. Much faster than Math.sin() for the
// per-column wave calculations that run every frame.
//
// The double-modulo `((angle % _2pi) + _2pi) % _2pi` normalises any angle
// (including negative values) to the range [0, 2π). Multiplying by
// SIN_TABLE_SIZE / 2π converts that to a fractional table index.
// `pos | 0` is a bitwise floor — faster than Math.floor() for positive numbers.
// The last line blends the two surrounding table entries for sub-entry precision.
function fastSin(angle) {
  const pos = (((angle % _2pi) + _2pi) % _2pi) / _2pi * SIN_TABLE_SIZE;
  const lo = pos | 0;                         // lower table index (bitwise floor)
  const hi = (lo + 1) % SIN_TABLE_SIZE;       // upper table index (wraps at end)
  return SIN_TABLE[lo] + (pos - lo) * (SIN_TABLE[hi] - SIN_TABLE[lo]); // lerp
}

// Module-scope Physics behavior lookup cache — shared across all instances.
// Maps instance UID → Physics ISDKBehaviorInstance (or null if confirmed absent).
const _physicsBehCache = new Map();



export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();

      // ── Read init properties (indices match config.caw.js declaration order) ──
      // 0:tension 1:dampening 2:spread 3:meshColumns 4:meshRows 5:autoWaves
      // 6:waveLength 7:period 8:magnitude 9:autoPhysicsForce 10:physicsForceMultiplier
      // 11:physicsSurfaceRadius 12:idleThreshold 13:spreadPassCount
      const properties = this._getInitProperties();

      // Liquid Physics (0–2)
      this._tension    = properties[0];
      this._dampening  = properties[1];
      this._spread     = properties[2];

      // Mesh (3–4)
      this._meshColumns = Math.max(2, Math.round(properties[3]));
      this._meshRows    = Math.max(2, Math.round(properties[4]));

      // Auto-Waves (5–8)
      this._autowavesEnabled = !!properties[5];
      this._waveLength       = properties[6];
      this._period           = properties[7];
      this._magnitude        = properties[8];
      this._phase            = 0; // accumulated phase for auto-wave

      // Physics Auto-Force (9–11)
      this._autoPhysicsForce       = !!properties[9];
      this._physicsForceMultiplier = properties[10];
      this._physicsSurfaceRadius   = properties[11];

      // Performance (12–13)
      this._idleThreshold   = properties[12];
      this._spreadPassCount = Math.max(1, Math.min(16, Math.round(properties[13])));

      // Simulation state
      this._targetHeight = 0;

      // Impact context — written before _trigger("OnPhysicsImpact")
      this._impactX     = 0;
      this._impactForce = 0;
      this._impactUID   = 0;

      // Physics tracking
      this._physicsTracked = new Set(); // UIDs currently overlapping the water

      // Hybrid buoyancy config
      this._physicsObjectTypeDefaults = new Map();
      this._physicsInstanceOverrides = new Map();

      // Lazy object types cache
      this._objectTypesArr = null;
      this._objectTypesCount = -1;

      // Allocate typed arrays
      this._allocateColumns(this._meshColumns);

      // Start ticking immediately — _tick() will check idle and stop if needed
      this._setTicking(true);
    }

    _trigger(method) {
      super._trigger(self.C3[AddonTypeMap[addonType]][id].Cnds[method]);
    }

    // Allocate or reallocate the five parallel typed arrays for n columns.
    // Float64Arrays are used for the hot simulation loop to avoid JS boxing overhead.
    //   _height   - current displacement of each column from the rest position (px)
    //   _speed    - vertical velocity of each column (px/tick)
    //   _displayY - world-Y of each column top, cached for SurfaceY expression queries
    //   _lDeltas  - scratch buffer: spread impulse flowing left this pass
    //   _rDeltas  - scratch buffer: spread impulse flowing right this pass
    _allocateColumns(n) {
      this._height   = new Float64Array(n);
      this._speed    = new Float64Array(n);
      this._displayY = new Float64Array(n);
      this._lDeltas  = new Float64Array(n);
      this._rDeltas  = new Float64Array(n);
    }

    _postCreate() {
      const inst = this.instance;

      // Rest position: height[i] = 0 means the surface sits at the top edge (normY = 0).
      this._targetHeight = 0;

      // Create the mesh using the scripting API (lowercase).
      // this.instance is IWorldInstance (scripting API)
      inst.createMesh(this._meshColumns, this._meshRows);

      // Initialise all column heights to rest
      this._writeAllMeshPoints();
    }

    _tick() {
      const n          = this._meshColumns;
      const dt         = this.runtime.dt;
      const waveOn     = this._autowavesEnabled;
      const tension    = this._tension;
      const dampening  = this._dampening;
      const spread     = this._spread;

      // ── Auto-wave phase accumulation ────────────────────────────────────────
      if (waveOn && this._period > 0) {
        this._phase = (this._phase + dt / this._period) % 1.0;
      }

      const inst    = this.instance;
      const bbox    = inst.getBoundingBox();
      const bboxTop = bbox.top;
      const bboxH   = inst.height;
      if (bboxH === 0) return;
      const invH    = 1 / bboxH;
      const objW    = inst.width;

      // ── Spring-damper pass ─────────────────────────────────────────────────
      // Classic Verlet-style spring-damper applied per column:
      //   acceleration = −tension × displacement − dampening × velocity
      // `tension` (spring stiffness k) pulls the column back toward its rest
      // height; `dampening` (damping coefficient c) dissipates energy so the
      // oscillation decays over time rather than ringing indefinitely.
      const height = this._height;
      const speed  = this._speed;
      let maxAbsSpeed = 0;

      if (waveOn) {
        // Auto-wave: each column's rest position oscillates sinusoidally.
        // wavelenFrac maps the object's pixel width into wave-period units so
        // that _waveLength controls how many pixels one full cycle spans.
        const wavelenFrac = objW > 0 ? objW / this._waveLength : 1;
        const mag         = this._magnitude;
        const phase       = this._phase;
        for (let i = 0; i < n; i++) {
          const waveY  = fastSin((i / (n - 1)) * wavelenFrac * _2pi - phase * _2pi) * mag;
          const target = this._targetHeight + waveY;
          const dh     = height[i] - target;
          speed[i]    += -tension * dh - dampening * speed[i];
          height[i]   += speed[i];
        }
      } else {
        const target = this._targetHeight;
        for (let i = 0; i < n; i++) {
          const dh = height[i] - target;
          speed[i] += -tension * dh - dampening * speed[i];
          height[i] += speed[i];
          // Track the largest speed this tick for idle detection below.
          const abs = speed[i] < 0 ? -speed[i] : speed[i];
          if (abs > maxAbsSpeed) maxAbsSpeed = abs;
        }
      }

      // ── Spread pass ────────────────────────────────────────────────────────
      // Simulates lateral wave propagation: each column transfers height to its
      // neighbours proportional to how much higher it is than them (water flows
      // downhill). The deltas are computed into scratch buffers *before* being
      // applied so that within one pass every column reads the pre-update heights,
      // preventing directional bias. Multiple passes per tick increase the
      // effective propagation distance without raising the simulation frequency.
      const lDeltas = this._lDeltas;
      const rDeltas = this._rDeltas;
      const passes  = this._spreadPassCount;

      for (let p = 0; p < passes; p++) {
        // First column has no left neighbour, last has no right neighbour.
        lDeltas[0] = 0;
        rDeltas[0] = spread * (height[0] - height[1]);

        for (let i = 1; i < n - 1; i++) {
          lDeltas[i] = spread * (height[i] - height[i - 1]);
          rDeltas[i] = spread * (height[i] - height[i + 1]);
        }

        lDeltas[n - 1] = spread * (height[n - 1] - height[n - 2]);
        rDeltas[n - 1] = 0;

        // Apply accumulated deltas - both height and speed are adjusted so
        // the transferred momentum is conserved across the simulation.
        for (let i = 0; i < n; i++) {
          speed[i]  -= lDeltas[i] + rDeltas[i];
          height[i] -= lDeltas[i] + rDeltas[i];
        }
      }

      // ── Physics auto-force ─────────────────────────────────────────────────
      if (this._isPhysicsAutomationEnabled()) {
        this._checkPhysicsCollisions();
      }

      // ── Write mesh points ──────────────────────────────────────────────────
      // setMeshPoint(col, row, { mode, x, y, u, v })
      // "absolute" mode: x/y are normalized 0-1 relative to object bounds.
      // texV = 0 keeps the top-row UV at the top of the texture (no distortion).
      const displayY = this._displayY;

      for (let i = 0; i < n; i++) {
        const worldY  = bboxTop + height[i];
        displayY[i]   = worldY;
        const normY   = (worldY - bboxTop) * invH;
        const normX   = i / (n - 1);
        inst.setMeshPoint(i, 0, { mode: "absolute", x: normX, y: normY, u: normX, v: 0 });
      }

      // ── Idle detection ─────────────────────────────────────────────────────
      if (!waveOn && !this._isPhysicsAutomationEnabled() && this._idleThreshold > 0) {
        if (maxAbsSpeed < this._idleThreshold) {
          // Snap all columns exactly to rest
          for (let i = 0; i < n; i++) {
            height[i] = this._targetHeight;
            speed[i]  = 0;
          }
          this._setTicking(false);
        }
      }
    }

    _writeAllMeshPoints() {
      const n       = this._meshColumns;
      const inst    = this.instance;
      const bbox    = inst.getBoundingBox();
      const bboxTop = bbox.top;
      const bboxH   = inst.height;
      if (bboxH === 0) return;
      const invH    = 1 / bboxH;

      for (let i = 0; i < n; i++) {
        const worldY = bboxTop + this._height[i];
        this._displayY[i] = worldY;
        const normY  = (worldY - bboxTop) * invH;
        const normX  = i / (n - 1);
        inst.setMeshPoint(i, 0, { mode: "absolute", x: normX, y: normY, u: normX, v: 0 });
      }
    }

    _getSurfaceYAtX(x) {
      if (!this.instance) return 0;

      const bbox = this.instance.getBoundingBox();
      if (x < bbox.left || x > bbox.right) return bbox.top;

      const colWidth = this.instance.width / (this._meshColumns - 1);
      const col = Math.max(
        0,
        Math.min(this._meshColumns - 1, Math.round((x - bbox.left) / colWidth))
      );

      return this._displayY[col];
    }

    _isPhysicsAutomationEnabled() {
      return this._autoPhysicsForce;
    }

    _flattenSurfaceInternal(percent = 100) {
      const normalizedPercent = percent === undefined ? 100 : +percent;
      const flattenRatio = Math.max(
        0,
        Math.min(100, Number.isFinite(normalizedPercent) ? normalizedPercent : 0)
      ) / 100;
      if (flattenRatio === 0) return;

      const n = this._meshColumns;
      const target = this._targetHeight;
      const keepRatio = 1 - flattenRatio;
      let hasResidual = false;

      for (let i = 0; i < n; i++) {
        const nextOffset = (this._height[i] - target) * keepRatio;
        const nextSpeed = this._speed[i] * keepRatio;
        this._height[i] = target + nextOffset;
        this._speed[i] = nextSpeed;

        if (!hasResidual && (Math.abs(nextOffset) > 1e-9 || Math.abs(nextSpeed) > 1e-9)) {
          hasResidual = true;
        }
      }

      this._writeAllMeshPoints();

      if (hasResidual || this._autoPhysicsForce || this._autowavesEnabled) {
        if (!this._isTicking()) this._setTicking(true);
      } else {
        this._setTicking(false);
      }
    }

    _flattenSurfaceByPercentInternal(percent) {
      this._flattenSurfaceInternal(percent);
    }

    _getSurfaceNormalRadians(x) {
      if (!this.instance) return -Math.PI / 2;

      const n = this._meshColumns;
      if (n < 2) return -Math.PI / 2;

      const inst = this.instance;
      const bbox = inst.getBoundingBox();
      const colWidth = inst.width / (n - 1);
      if (colWidth === 0) return -Math.PI / 2;

      const clampedX = Math.max(bbox.left, Math.min(bbox.right, x));
      const col = Math.max(0, Math.min(n - 1, Math.round((clampedX - bbox.left) / colWidth)));
      const leftCol = Math.max(0, col - 1);
      const rightCol = Math.min(n - 1, col + 1);

      if (leftCol === rightCol) return -Math.PI / 2;

      const leftX = bbox.left + leftCol * colWidth;
      const rightX = bbox.left + rightCol * colWidth;
      const dx = rightX - leftX;
      if (dx === 0) return -Math.PI / 2;

      const dy = this._displayY[rightCol] - this._displayY[leftCol];

      // Tangent = (dx, dy). The upward surface normal is (dy, -dx).
      return Math.atan2(-dx, dy);
    }

    _getSurfaceNormalAngle(x) {
      const degrees = this._getSurfaceNormalRadians(x) * 180 / Math.PI;
      return ((degrees % 360) + 360) % 360;
    }

    _applyForceInternal(worldX, force, surfacePx) {
      const colWidth = this.instance.width / (this._meshColumns - 1);
      if (colWidth <= 0) return;
      const bbox      = this.instance.getBoundingBox();
      const centerCol = Math.round((worldX - bbox.left) / colWidth);
      const radCols   = Math.ceil(surfacePx / colWidth);
      const n         = this._meshColumns;

      // Linear falloff: the column at the impact point receives 100 % of the
      // force; columns at the edge of the radius receive ~0 %. Using
      // (radCols + 1) in the denominator keeps factor > 0 at the boundary
      // column so the transition doesn't snap abruptly to zero.
      for (let i = Math.max(0, centerCol - radCols); i <= Math.min(n - 1, centerCol + radCols); i++) {
        const dist   = Math.abs(i - centerCol) / (radCols + 1);
        const factor = 1 - dist;
        this._speed[i] += force * factor;
      }

      if (!this._isTicking()) this._setTicking(true);
    }

    _getObjectTypeName(objectTypeName) {
      if (typeof objectTypeName === "string") {
        return objectTypeName;
      }

      if (!objectTypeName || typeof objectTypeName !== "object") {
        return "";
      }

      if (typeof objectTypeName.name === "string") {
        return objectTypeName.name;
      }

      if (typeof objectTypeName._name === "string") {
        return objectTypeName._name;
      }

      if (typeof objectTypeName.objectType?.name === "string") {
        return objectTypeName.objectType.name;
      }

      const pickedInstance = typeof objectTypeName.getFirstPickedInstance === "function"
        ? objectTypeName.getFirstPickedInstance()
        : null;
      if (typeof pickedInstance?.objectType?.name === "string") {
        return pickedInstance.objectType.name;
      }

      return "";
    }

    _normalizeObjectTypeKey(objectTypeName) {
      return this._getObjectTypeName(objectTypeName).trim().toLowerCase();
    }

    _normalizeInstanceUid(uid) {
      const normalizedUid = Math.trunc(+uid);
      return Number.isFinite(normalizedUid) && normalizedUid > 0 ? normalizedUid : 0;
    }

    _sanitizeBuoyancyValue(field, value) {
      const numberValue = +value;
      if (!Number.isFinite(numberValue)) return null;
      return field === "surfaceRadius" ? Math.max(0, numberValue) : numberValue;
    }

    _setBuoyancyMapValue(map, key, field, value) {
      if (!key) return;

      const normalizedValue = this._sanitizeBuoyancyValue(field, value);
      if (normalizedValue === null) return;

      const entry = map.get(key) ?? {};
      entry[field] = normalizedValue;
      map.set(key, entry);
    }

    _clearBuoyancyMapValue(map, key, field) {
      if (!key) return;

      const entry = map.get(key);
      if (!entry) return;

      delete entry[field];

      if (entry.forceMultiplier === undefined && entry.surfaceRadius === undefined) {
        map.delete(key);
      }
    }

    _getObjectTypeDefaultsEntry(objectTypeName) {
      const key = this._normalizeObjectTypeKey(objectTypeName);
      return key ? this._physicsObjectTypeDefaults.get(key) ?? null : null;
    }

    _getInstanceOverrideEntry(uid) {
      const normalizedUid = this._normalizeInstanceUid(uid);
      if (!normalizedUid) return null;

      const entry = this._physicsInstanceOverrides.get(normalizedUid);
      if (!entry) return null;

      if (!this.runtime.getInstanceByUid(normalizedUid)) {
        this._physicsInstanceOverrides.delete(normalizedUid);
        return null;
      }

      return entry;
    }

    _getObjectTypeNameFromInstance(inst) {
      return inst?.objectType?.name ?? "";
    }

    _resolveBuoyancySettings(inst) {
      const resolved = {
        forceMultiplier: this._physicsForceMultiplier,
        surfaceRadius: this._physicsSurfaceRadius,
      };

      const objectTypeEntry = this._getObjectTypeDefaultsEntry(
        this._getObjectTypeNameFromInstance(inst)
      );
      if (objectTypeEntry) {
        if (objectTypeEntry.forceMultiplier !== undefined) {
          resolved.forceMultiplier = objectTypeEntry.forceMultiplier;
        }
        if (objectTypeEntry.surfaceRadius !== undefined) {
          resolved.surfaceRadius = objectTypeEntry.surfaceRadius;
        }
      }

      const instanceEntry = this._getInstanceOverrideEntry(inst?.uid);
      if (instanceEntry) {
        if (instanceEntry.forceMultiplier !== undefined) {
          resolved.forceMultiplier = instanceEntry.forceMultiplier;
        }
        if (instanceEntry.surfaceRadius !== undefined) {
          resolved.surfaceRadius = instanceEntry.surfaceRadius;
        }
      }

      return resolved;
    }

    _resolveBuoyancySettingsForObjectType(objectTypeName) {
      const resolved = {
        forceMultiplier: this._physicsForceMultiplier,
        surfaceRadius: this._physicsSurfaceRadius,
      };

      const entry = this._getObjectTypeDefaultsEntry(objectTypeName);
      if (!entry) return resolved;

      if (entry.forceMultiplier !== undefined) {
        resolved.forceMultiplier = entry.forceMultiplier;
      }
      if (entry.surfaceRadius !== undefined) {
        resolved.surfaceRadius = entry.surfaceRadius;
      }

      return resolved;
    }

    _resolveBuoyancySettingsForUID(uid) {
      const normalizedUid = this._normalizeInstanceUid(uid);
      if (!normalizedUid) {
        return {
          forceMultiplier: this._physicsForceMultiplier,
          surfaceRadius: this._physicsSurfaceRadius,
        };
      }

      const inst = this.runtime.getInstanceByUid(normalizedUid);
      if (!inst) {
        this._physicsInstanceOverrides.delete(normalizedUid);
        return {
          forceMultiplier: this._physicsForceMultiplier,
          surfaceRadius: this._physicsSurfaceRadius,
        };
      }

      return this._resolveBuoyancySettings(inst);
    }

    _setObjectTypeBuoyancyValue(objectTypeName, field, value) {
      const key = this._normalizeObjectTypeKey(objectTypeName);
      this._setBuoyancyMapValue(this._physicsObjectTypeDefaults, key, field, value);
    }

    _clearObjectTypeBuoyancyValue(objectTypeName, field) {
      const key = this._normalizeObjectTypeKey(objectTypeName);
      this._clearBuoyancyMapValue(this._physicsObjectTypeDefaults, key, field);
    }

    _setInstanceBuoyancyValue(uid, field, value) {
      const normalizedUid = this._normalizeInstanceUid(uid);
      this._setBuoyancyMapValue(this._physicsInstanceOverrides, normalizedUid, field, value);
    }

    _clearInstanceBuoyancyValue(uid, field) {
      const normalizedUid = this._normalizeInstanceUid(uid);
      this._clearBuoyancyMapValue(this._physicsInstanceOverrides, normalizedUid, field);
    }

    _getBuoyancySettingKey(setting) {
      if (typeof setting === "string") {
        const normalized = setting
          .trim()
          .replace(/([a-z])([A-Z])/g, "$1_$2")
          .toLowerCase()
          .replace(/[\s-]+/g, "_");

        if (normalized === "surface_radius" || normalized === "radius") {
          return "surfaceRadius";
        }

        if (
          normalized === "force_multiplier" ||
          normalized === "multiplier" ||
          normalized === "force"
        ) {
          return "forceMultiplier";
        }
      }

      return ["forceMultiplier", "surfaceRadius"][Math.trunc(+setting)] ?? "forceMultiplier";
    }

    _setDefaultBuoyancyValue(setting, value) {
      const field = this._getBuoyancySettingKey(setting);
      const normalizedValue = this._sanitizeBuoyancyValue(field, value);
      if (normalizedValue === null) return;

      if (field === "surfaceRadius") {
        this._physicsSurfaceRadius = normalizedValue;
        return;
      }

      this._physicsForceMultiplier = normalizedValue;
    }

    _getResolvedBuoyancyValue(resolved, setting) {
      return resolved[this._getBuoyancySettingKey(setting)];
    }

    _getPhysicsVelocityY(physBeh) {
      if (typeof physBeh.getVelocityY === "function") {
        return physBeh.getVelocityY();
      }

      if (typeof physBeh.GetVelocityY === "function") {
        return physBeh.GetVelocityY();
      }

      if (typeof physBeh.velocityY === "number") {
        return physBeh.velocityY;
      }

      if (typeof physBeh.VelocityY === "number") {
        return physBeh.VelocityY;
      }

      return null;
    }

    _pruneDestroyedInstanceOverrides() {
      for (const uid of this._physicsInstanceOverrides.keys()) {
        if (!this.runtime.getInstanceByUid(uid)) {
          this._physicsInstanceOverrides.delete(uid);
        }
      }
    }

    _rebuildMesh(newCols, newRows) {
      newCols = Math.max(2, Math.round(newCols));
      newRows = Math.max(2, Math.round(newRows));

      const oldCols = this._meshColumns;

      if (newCols === oldCols && newRows === this._meshRows) return;

      if (newCols !== oldCols) {
        // Linearly resample height and speed into the new column count so that
        // the wave shape is preserved rather than reset. Each new column maps to
        // a fractional position `src` in the old array; `lo`/`hi` are the
        // surrounding source indices and `frac` is the blend weight toward `hi`.
        const oldH = this._height;
        const oldS = this._speed;

        this._meshColumns = newCols;
        this._allocateColumns(newCols);

        for (let i = 0; i < newCols; i++) {
          const t    = i / (newCols - 1);
          const src  = t * (oldCols - 1);
          const lo   = src | 0;
          const hi   = Math.min(lo + 1, oldCols - 1);
          const frac = src - lo;
          this._height[i] = oldH[lo] + frac * (oldH[hi] - oldH[lo]);
          this._speed[i]  = oldS[lo] + frac * (oldS[hi] - oldS[lo]);
        }

        this._physicsTracked.clear();
      }

      this._meshRows = newRows;

      // Recreate mesh
      this.instance.createMesh(this._meshColumns, this._meshRows);

      // Re-apply current column heights to the new mesh
      this._writeAllMeshPoints();

      if (!this._isTicking()) this._setTicking(true);
    }

    _checkPhysicsCollisions() {
      const waterInst = this.instance;
      const waterBox  = waterInst.getBoundingBox();
      const shouldApplySplash = this._autoPhysicsForce;

      // Collect Physics instances currently overlapping the water instance.
      const currentOverlapping = new Set();

      for (const objType of this._getObjectTypesCache()) {
        for (const inst of objType.getAllInstances()) {
          if (inst === waterInst) continue;
          if (typeof inst.getBoundingBox !== "function") continue;

          const physBeh = this._getPhysicsBehavior(inst);
          if (!physBeh) continue;
          const ib = inst.getBoundingBox();
          if (
            ib.right < waterBox.left ||
            ib.left > waterBox.right ||
            ib.bottom < waterBox.top ||
            ib.top > waterBox.bottom
          ) {
            continue;
          }

          const uid = inst.uid;
          const wasOverlapping = this._physicsTracked.has(uid);
          currentOverlapping.add(uid);

          const overlapLeft  = Math.max(waterBox.left, ib.left);
          const overlapRight = Math.min(waterBox.right, ib.right);
          const worldX = overlapLeft <= overlapRight
            ? (overlapLeft + overlapRight) * 0.5
            : Math.max(waterBox.left, Math.min(waterBox.right, inst.x));

          // Fire only on entry (first tick overlapping the water instance).
          if (!wasOverlapping) {
            this._physicsTracked.add(uid);

            if (shouldApplySplash) {
              const buoyancy = this._resolveBuoyancySettings(inst);
              const velY  = this._getPhysicsVelocityY(physBeh) ?? 0;
              const force = velY * buoyancy.forceMultiplier;

              this._applyForceInternal(worldX, force, buoyancy.surfaceRadius);

              // Write impact context then fire trigger
              this._impactX     = worldX;
              this._impactForce = force;
              this._impactUID   = uid;
              this._trigger("OnPhysicsImpact");
            }
          }
        }
      }

      // Remove from tracked any UIDs that are no longer overlapping.
      for (const uid of this._physicsTracked) {
        if (!currentOverlapping.has(uid)) {
          this._physicsTracked.delete(uid);
          _physicsBehCache.delete(uid);
        }
      }
    }

    _getPhysicsBehavior(inst) {
      const uid = inst.uid;
      if (_physicsBehCache.has(uid)) return _physicsBehCache.get(uid);

      const behaviors = inst.behaviors;
      if (!behaviors) return null;

      const directPhysics = behaviors.Physics;
      if (directPhysics && typeof directPhysics.getVelocityY === "function") {
        _physicsBehCache.set(uid, directPhysics);
        return directPhysics;
      }

      for (const beh of Object.values(behaviors)) {
        if (beh.behaviorType?.name === "Physics") {
          _physicsBehCache.set(uid, beh);
          return beh;
        }
      }

      return null;
    }

    _getObjectTypesCache() {
      const objects = this.runtime.objects;
      if (!objects) {
        this._objectTypesCount = 0;
        this._objectTypesArr = [];
        return this._objectTypesArr;
      }

      // Some C3 runtimes expose runtime.objects as an iterable; others expose
      // an object map keyed by object type name. Support both shapes.
      if (typeof objects[Symbol.iterator] === "function") {
        let count = 0;
        for (const _ of objects) count++;
        if (count !== this._objectTypesCount) {
          this._objectTypesCount = count;
          this._objectTypesArr = [...objects];
        }
        return this._objectTypesArr;
      }

      this._objectTypesArr = Object.values(objects).filter(objType =>
        objType && typeof objType.getAllInstances === "function"
      );
      this._objectTypesCount = this._objectTypesArr.length;
      return this._objectTypesArr;
    }

    _getDebuggerProperties() {
      return [
        {
          title: `$${this.behaviorType.name} - Physics`,
          properties: [
            { name: "$Tension",   value: this._tension,   onedit: v => { this._tension = +v; } },
            { name: "$Dampening", value: this._dampening, onedit: v => { this._dampening = +v; } },
            { name: "$Spread",    value: this._spread,    onedit: v => { this._spread = +v; } },
          ],
        },
        {
          title: `$${this.behaviorType.name} - Simulation`,
          properties: [
            { name: "$Mesh Columns", value: this._meshColumns },
            { name: "$Mesh Rows",    value: this._meshRows },
            { name: "$Is Idle",      value: !this._isTicking() },
            { name: "$Spread Pass Count", value: this._spreadPassCount, onedit: v => { this._spreadPassCount = Math.max(1, Math.min(16, Math.round(+v))); } },
          ],
        },
        {
          title: `$${this.behaviorType.name} - Auto-Wave`,
          properties: [
            { name: "$Enabled",     value: this._autowavesEnabled, onedit: v => { this.SetAutoWavesEnabled(!!v); } },
            { name: "$Wave Length", value: this._waveLength,       onedit: v => { this._waveLength = +v; } },
            { name: "$Period",      value: this._period,           onedit: v => { this._period = +v; } },
            { name: "$Magnitude",   value: this._magnitude,        onedit: v => { this._magnitude = +v; } },
          ],
        },
        {
          title: `$${this.behaviorType.name} — Physics Force`,
          properties: [
            { name: "$Auto Physics Force",       value: this._autoPhysicsForce },
            { name: "$Force Multiplier",         value: this._physicsForceMultiplier, onedit: v => { this._physicsForceMultiplier = +v; } },
            { name: "$Physics Surface Radius",   value: this._physicsSurfaceRadius,   onedit: v => { this._physicsSurfaceRadius = +v; } },
            { name: "$Object Type Defaults",     value: this._physicsObjectTypeDefaults.size },
            { name: "$Instance Overrides",       value: this._physicsInstanceOverrides.size },
            { name: "$Tracked Count",            value: this._physicsTracked.size },
          ],
        },
        {
          title: `$${this.behaviorType.name} — Performance`,
          properties: [
            { name: "$Idle Threshold", value: this._idleThreshold, onedit: v => { this._idleThreshold = +v; } },
          ],
        },
      ];
    }

    _saveToJson() {
      this._pruneDestroyedInstanceOverrides();

      return {
        tension:    this._tension,
        dampening:  this._dampening,
        spread:     this._spread,
        meshColumns: this._meshColumns,
        meshRows:    this._meshRows,
        autowavesEnabled: this._autowavesEnabled,
        waveLength:  this._waveLength,
        period:      this._period,
        magnitude:   this._magnitude,
        phase:       this._phase,
        autoPhysicsForce:       this._autoPhysicsForce,
        physicsForceMultiplier: this._physicsForceMultiplier,
        physicsSurfaceRadius:   this._physicsSurfaceRadius,
        physicsObjectTypeDefaults: Array.from(this._physicsObjectTypeDefaults.entries()),
        physicsInstanceOverrides: Array.from(this._physicsInstanceOverrides.entries()),
        idleThreshold:   this._idleThreshold,
        spreadPassCount: this._spreadPassCount,
        height: Array.from(this._height),
        speed:  Array.from(this._speed),
      };
    }

    _loadFromJson(o) {
      this._tension    = o.tension    ?? 0.025;
      this._dampening  = o.dampening  ?? 0.025;
      this._spread     = o.spread     ?? 0.25;

      const newCols = Math.max(2, Math.round(o.meshColumns ?? 64));
      const newRows = Math.max(2, Math.round(o.meshRows    ?? 2));
      this._meshColumns = newCols;
      this._meshRows    = newRows;

      this._autowavesEnabled = o.autowavesEnabled ?? false;
      this._waveLength       = o.waveLength ?? 150;
      this._period           = o.period     ?? 2;
      this._magnitude        = o.magnitude  ?? 2;
      this._phase            = o.phase      ?? 0;

      this._autoPhysicsForce       = o.autoPhysicsForce       ?? false;
      this._physicsForceMultiplier = o.physicsForceMultiplier ?? 1.0;
      this._physicsSurfaceRadius   = o.physicsSurfaceRadius   ?? 20;

      this._physicsObjectTypeDefaults.clear();
      for (const [objectTypeName, entry] of o.physicsObjectTypeDefaults ?? []) {
        const key = this._normalizeObjectTypeKey(objectTypeName);
        if (!key || !entry) continue;

        const nextEntry = {};
        const forceMultiplier = this._sanitizeBuoyancyValue("forceMultiplier", entry.forceMultiplier);
        const surfaceRadius = this._sanitizeBuoyancyValue("surfaceRadius", entry.surfaceRadius);

        if (forceMultiplier !== null) nextEntry.forceMultiplier = forceMultiplier;
        if (surfaceRadius !== null) nextEntry.surfaceRadius = surfaceRadius;

        if (nextEntry.forceMultiplier !== undefined || nextEntry.surfaceRadius !== undefined) {
          this._physicsObjectTypeDefaults.set(key, nextEntry);
        }
      }

      this._physicsInstanceOverrides.clear();
      for (const [uid, entry] of o.physicsInstanceOverrides ?? []) {
        const normalizedUid = this._normalizeInstanceUid(uid);
        if (!normalizedUid || !entry) continue;

        const nextEntry = {};
        const forceMultiplier = this._sanitizeBuoyancyValue("forceMultiplier", entry.forceMultiplier);
        const surfaceRadius = this._sanitizeBuoyancyValue("surfaceRadius", entry.surfaceRadius);

        if (forceMultiplier !== null) nextEntry.forceMultiplier = forceMultiplier;
        if (surfaceRadius !== null) nextEntry.surfaceRadius = surfaceRadius;

        if (nextEntry.forceMultiplier !== undefined || nextEntry.surfaceRadius !== undefined) {
          this._physicsInstanceOverrides.set(normalizedUid, nextEntry);
        }
      }

      this._idleThreshold  = o.idleThreshold  ?? 0.01;
      this._spreadPassCount = Math.max(1, Math.min(16, Math.round(o.spreadPassCount ?? 7)));

      this._allocateColumns(newCols);

      const savedH = o.height ?? [];
      const savedS = o.speed  ?? [];
      for (let i = 0; i < newCols; i++) {
        this._height[i] = savedH[i] ?? this._targetHeight;
        this._speed[i]  = savedS[i] ?? 0;
      }

      this._physicsTracked.clear();

      // Mesh will be recreated in _postCreate() with the restored dimensions.
      // _writeAllMeshPoints() will also be called there with the restored heights.

      if (!this._isTicking()) this._setTicking(true);
    }

    _release() {
      this._physicsTracked.clear();
      this._physicsObjectTypeDefaults.clear();
      this._physicsInstanceOverrides.clear();
      super._release();
    }
  };
}
