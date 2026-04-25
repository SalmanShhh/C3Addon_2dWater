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

// Patched draw functions — installed on the host SDK instance in _onCreate().
// `this` inside these functions is the host SDK instance (TiledBg or Sprite).

// Replacement for Sprite's Draw(). C3 normally handles UV remapping for
// atlas-packed sprites before calling DrawMesh, but because we deform the mesh
// ourselves we need to intercept at this level. We capture the image info so
// _patchedDrawMesh can set the correct texture, then delegate to DrawMesh
// (which is itself patched to draw the deformed mesh).
function _patchedDraw(renderer) {
  const imageInfo = this.GetCurrentImageInfo();
  if (!imageInfo) return;
  // Store as a non-null sentinel so _patchedDrawMesh knows image info resolved.
  // The value is also used to obtain the texture in _patchedDrawMesh.
  this._aqRcTex = imageInfo.GetTexRect();
  this.DrawMesh(this._aqWi, renderer); // calls _patchedDrawMesh
}

// Replacement for both TiledBackground's and Sprite's DrawMesh().
// Falls back to the original implementation whenever the mesh or its
// transformed data isn't ready, so C3 always gets a valid draw call.
// _aqRcTex being non-null confirms that image info was resolved by
// _patchedDraw (Sprite path) or that the TiledBackground is ready to draw.
function _patchedDrawMesh(wi, renderer) {
  if (!this._aqRcTex) {
    // Image info not yet resolved — let the original implementation handle it.
    this._origDrawMesh(wi, renderer);
    return;
  }
  const mesh = wi.GetMesh();
  if (!mesh) {
    this._origDrawMesh(wi, renderer);
    return;
  }
  const transformedMesh = mesh.GetTransformedMesh();
  if (!transformedMesh) {
    this._origDrawMesh(wi, renderer);
    return;
  }
  // Bind the sprite/tile texture, then let the transformed mesh draw itself
  // using the UVs that were written by SetMeshPoint() each tick.
  renderer.SetTexture(this.GetCurrentImageInfo().GetTexture());
  transformedMesh.Draw(renderer);
}

export default function (parentClass) {
  return class extends parentClass {
    constructor() {
      super();

      // ── Read init properties (indices match config.caw.js declaration order) ──
      // 0:tension 1:dampening 2:spread 3:meshColumns 4:meshRows 5:autoWaves
      // 6:waveLength 7:period 8:magnitude 9:autoPhysicsForce 10:physicsForceMultiplier
      // 11:physicsSurfaceRadius 12:surfaceDetectionDepth 13:idleThreshold 14:spreadPassCount
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

      // Physics Auto-Force (9–12)
      this._autoPhysicsForce       = !!properties[9];
      this._physicsForceMultiplier = properties[10];
      this._physicsSurfaceRadius   = properties[11];
      this._surfaceDetectionDepth  = properties[12];

      // Performance (13–14)
      this._idleThreshold   = properties[13];
      this._spreadPassCount = Math.max(1, Math.min(16, Math.round(properties[14])));

      // Simulation state
      this._targetHeight = 0; // set in _onCreate once we know object height
      this._wi = null;        // world info — set in _onCreate
      this._hostType = "";    // "TiledBackground" or "Sprite"

      // Impact context — written before _trigger("OnPhysicsImpact")
      this._impactX     = 0;
      this._impactForce = 0;
      this._impactUID   = 0;

      // Physics tracking
      this._physicsTracked = new Set(); // UIDs currently in the surface zone

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

    _onCreate() {
      const inst = this.instance;
      this._wi = inst.GetWorldInfo();

      // Determine host plugin type
      const pluginId = inst.GetObjectClass().GetPlugin().GetID().toLowerCase();
      if (pluginId.includes("tiledbg") || pluginId.includes("tiledbackground")) {
        this._hostType = "TiledBackground";
      } else {
        this._hostType = "Sprite";
      }

      // Set target (rest) height from current object height
      this._targetHeight = this._wi.GetHeight();

      // Create the mesh
      const sdkInst = inst.GetSdkInstance();
      sdkInst.CreateMesh(this._meshColumns, this._meshRows);

      // Patch Draw / DrawMesh to handle UV correctly
      this._installDrawPatch(sdkInst);

      // Initialise all column heights to rest
      this._writeAllMeshPoints();
    }

    _installDrawPatch(sdkInst) {
      // Store the world info ref on the host SDK instance for the patched draw
      sdkInst._aqWi = this._wi;
      sdkInst._aqRcTex = null;

      if (this._hostType === "TiledBackground") {
        // TiledBackground's built-in Draw() calls DrawMesh() internally
        // patching DrawMesh is sufficient to intercept the deformed-mesh draw.
        if (!sdkInst._origDrawMesh && sdkInst.DrawMesh) {
          sdkInst._origDrawMesh = sdkInst.DrawMesh.bind(sdkInst);
          sdkInst.DrawMesh = _patchedDrawMesh;
        }
      } else {
        // Sprite — patch Draw
        if (!sdkInst._origDraw && sdkInst.Draw) {
          sdkInst._origDraw = sdkInst.Draw.bind(sdkInst);
          sdkInst.Draw = _patchedDraw;
          if (!sdkInst._origDrawMesh && sdkInst.DrawMesh) {
            sdkInst._origDrawMesh = sdkInst.DrawMesh.bind(sdkInst);
            sdkInst.DrawMesh = _patchedDrawMesh;
          }
        }
      }
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

      const wi      = this._wi;
      if (!wi) return;
      const bbox    = wi.GetBoundingBox();
      const bboxTop = bbox.top;
      const bboxH   = wi.GetHeight();
      if (bboxH === 0) return;
      const invH    = 1 / bboxH;
      const objW    = wi.GetWidth();

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
      if (this._autoPhysicsForce) {
        this._checkPhysicsCollisions();
      }

      // ── Write mesh points ──────────────────────────────────────────────────
      const displayY = this._displayY;
      const sdkInst  = this.instance.GetSdkInstance();

      for (let i = 0; i < n; i++) {
        const worldY  = bboxTop + height[i];
        displayY[i]   = worldY;
        const normY   = (worldY - bboxTop) * invH;
        const normX   = i / (n - 1);
        sdkInst.SetMeshPoint(i, 0, normX, normY, normX, normY);
      }

      wi.SetBboxChanged();
      this.runtime.updateRender();

      // ── Idle detection ─────────────────────────────────────────────────────
      if (!waveOn && this._idleThreshold > 0) {
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
      const wi      = this._wi;
      if (!wi) return;
      const bbox    = wi.GetBoundingBox();
      const bboxTop = bbox.top;
      const bboxH   = wi.GetHeight();
      if (bboxH === 0) return;
      const invH    = 1 / bboxH;
      const sdkInst = this.instance.GetSdkInstance();

      for (let i = 0; i < n; i++) {
        const worldY = bboxTop + this._height[i];
        this._displayY[i] = worldY;
        const normY  = (worldY - bboxTop) * invH;
        const normX  = i / (n - 1);
        sdkInst.SetMeshPoint(i, 0, normX, normY, normX, normY);
      }
      wi.SetBboxChanged();
    }

    _applyForceInternal(worldX, force, surfacePx) {
      if (!this._wi) return;
      const colWidth = this._wi.GetWidth() / (this._meshColumns - 1);
      if (colWidth <= 0) return;
      const bbox      = this._wi.GetBoundingBox();
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
          const lo   = src | 0;                        // bitwise floor
          const hi   = Math.min(lo + 1, oldCols - 1);
          const frac = src - lo;                       // blend weight toward hi
          this._height[i] = oldH[lo] + frac * (oldH[hi] - oldH[lo]);
          this._speed[i]  = oldS[lo] + frac * (oldS[hi] - oldS[lo]);
        }

        this._physicsTracked.clear();
      }

      this._meshRows = newRows;

      // Recreate mesh
      const sdkInst = this.instance.GetSdkInstance();
      sdkInst.CreateMesh(this._meshColumns, this._meshRows);

      // Re-apply current column heights to the new mesh
      this._writeAllMeshPoints();

      if (!this._isTicking()) this._setTicking(true);
    }

    _checkPhysicsCollisions() {
      const bbox    = this._wi.GetBoundingBox();
      const depth   = this._surfaceDetectionDepth;
      const zoneTop = bbox.top - depth;
      const zoneBtm = bbox.top + depth;

      // Collect current zone occupants
      const currentInZone = new Set();

      for (const objType of this._getObjectTypesCache()) {
        for (const inst of objType.getAllInstances()) {
          const physBeh = this._getPhysicsBehavior(inst);
          if (!physBeh) continue;

          const ib = inst.boundingBox;
          // Outside the surface detection zone — skip. The cleanup loop at the
          // end of this method will remove its UID from _physicsTracked and
          // _physicsBehCache if it was previously tracked (handles both
          // out-of-zone and destroyed instances in one place).
          if (ib.bottom < zoneTop || ib.top > zoneBtm) continue;

          const uid = inst.uid;
          currentInZone.add(uid);

          // Fire only on entry (first tick inside zone)
          if (!this._physicsTracked.has(uid)) {
            this._physicsTracked.add(uid);

            const velY  = physBeh.getVelocityY();
            const force = velY * this._physicsForceMultiplier;
            const worldX = inst.x;

            this._applyForceInternal(worldX, force, this._physicsSurfaceRadius);

            // Write impact context then fire trigger
            this._impactX     = worldX;
            this._impactForce = force;
            this._impactUID   = uid;
            this._trigger("OnPhysicsImpact");
          }
        }
      }

      // Remove from tracked any UIDs that have left the zone
      for (const uid of this._physicsTracked) {
        if (!currentInZone.has(uid)) {
          this._physicsTracked.delete(uid);
          _physicsBehCache.delete(uid);
        }
      }
    }

    _getPhysicsBehavior(inst) {
      const uid = inst.uid;
      if (_physicsBehCache.has(uid)) return _physicsBehCache.get(uid);

      const behaviors = inst.behaviors;
      if (!behaviors) { _physicsBehCache.set(uid, null); return null; }

      for (const beh of Object.values(behaviors)) {
        if (beh.behaviorType?.name === "Physics") {
          _physicsBehCache.set(uid, beh);
          return beh;
        }
      }

      _physicsBehCache.set(uid, null);
      return null;
    }

    _getObjectTypesCache() {
      // runtime.objects is an iterable with no .size property, so we count
      // via for-of to detect when object types have been added or removed
      // (e.g. a dynamically created type). Rebuilding the snapshot only when
      // the count changes avoids a spread allocation every tick.
      let count = 0;
      for (const _ of this.runtime.objects) count++;
      if (count !== this._objectTypesCount) {
        this._objectTypesCount = count;
        this._objectTypesArr = [...this.runtime.objects];
      }
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
            { name: "$Host Type",    value: this._hostType },
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
            { name: "$Surface Detection Depth",  value: this._surfaceDetectionDepth,  onedit: v => { this._surfaceDetectionDepth = +v; } },
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

    _release() {
      // Restore patched draw functions
      if (this.instance) {
        const sdkInst = this.instance.GetSdkInstance();
        if (sdkInst) {
          if (sdkInst._origDraw) {
            sdkInst.Draw = sdkInst._origDraw;
            sdkInst._origDraw = undefined;
          }
          if (sdkInst._origDrawMesh) {
            sdkInst.DrawMesh = sdkInst._origDrawMesh;
            sdkInst._origDrawMesh = undefined;
          }
          sdkInst._aqWi    = undefined;
          sdkInst._aqRcTex = undefined;
        }
      }
      super._release();
    }

    _saveToJson() {
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
        surfaceDetectionDepth:  this._surfaceDetectionDepth,
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
      this._surfaceDetectionDepth  = o.surfaceDetectionDepth  ?? 16;

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

      // Recreate mesh with restored dimensions and apply wave state
      const sdkInst = this.instance.GetSdkInstance();
      sdkInst.CreateMesh(this._meshColumns, this._meshRows);
      this._writeAllMeshPoints();

      if (!this._isTicking()) this._setTicking(true);
    }
  };
}
