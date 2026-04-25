# 2DWater — Testing Example

This document describes a complete Construct 3 test project that exercises every feature of the 2DWater behavior. Follow the layer structure, object list, and event sheet sections in order. Each section is self-contained — you can test features individually by copying only that section's events into a layout.

---

## Layer Structure

```
Layer 0: "UI"        — UI text and debug output (no parallax)
Layer 1: "Game"      — All gameplay objects (default)
Layer 2: "Water"     — The water Tiled Background objects
```

---

## Object List

| Object | Type | Notes |
|---|---|---|
| `WaterMain` | Tiled Background | 800 × 200, positioned at X=0 Y=400. Has 2DWater behavior. |
| `WaterNarrow` | Tiled Background | 200 × 120, positioned at X=900 Y=400. Has 2DWater behavior. |
| `Ball` | Sprite | Circle, 40×40. Has **Physics** behavior. Placed above WaterMain. |
| `Crate` | Sprite | Rectangle, 60×60. Has **Physics** behavior. Placed above WaterMain. |
| `Player` | Sprite | Rectangle, 30×60. Has **Platform** behavior. Placed above WaterMain. |
| `Cork` | Sprite | Small ellipse, 20×10. No behaviors. Used for surface-follow test. |
| `ProbeMarker` | Sprite | Tiny cross, 8×8. No behaviors. Tracks `SurfaceY` at a fixed X. |
| `DebugText` | Text | Multiline, top-left of UI layer. |
| `BtnApplyForce` | Button (or Sprite) | Labelled "Splash at centre". UI layer. |
| `BtnAutoWave` | Button (or Sprite) | Labelled "Toggle Auto-Wave". UI layer. |
| `BtnPhysics` | Button (or Sprite) | Labelled "Toggle Physics AF". UI layer. |
| `BtnRebuild` | Button (or Sprite) | Labelled "Rebuild Mesh 32". UI layer. |
| `SplashEffect` | Particles | Short upward burst. Spawned on impact. |

### WaterMain — 2DWater properties (initial)

```
Tension:                0.025
Dampening:              0.025
Spread:                 0.25
Mesh Columns:           64
Mesh Rows:              2
Enable Auto-Waves:      off
Wave Length:            150
Period:                 2
Magnitude:              2
Auto Physics Force:     off
Physics Force Mult:     1.0
Physics Surface Radius: 20
Surface Detection Depth:16
Idle Threshold:         0.01
Spread Pass Count:      7
```

### WaterNarrow — 2DWater properties (initial)

```
Mesh Columns:     16    (narrow object — fewer columns)
Dampening:        0.06  (slightly more viscous for contrast)
All other props:  same as WaterMain defaults
```

---

## Section 1 — Basic Splash (ApplyForce)

**What this tests:** `ApplyForce`, idle detection resuming, `SurfaceY`, `IsIdle`.

```
Event: Start of layout
  Action: DebugText → Set text -> "Click WaterMain to splash. Watch ripples propagate and decay."

Event: Mouse → On left button clicked
  Condition: Mouse is over WaterMain
  Action: WaterMain → Apply Force -> Mouse.X, -100, 30
  // Splash at cursor position, downward, 30px radius.

Event: Every tick
  Action: DebugText → Set text ->
    "Idle: " & WaterMain.IsIdle &
    "  SurfaceY@400: " & int(WaterMain.SurfaceY(400)) &
    "  Columns: " & WaterMain.MeshColumns

Event: WaterMain → Simulation is idle
  // Confirm idle fires once on settle.
  Action: DebugText → Append text -> "  [IDLE]"
```

**Expected result:** Clicking the water causes a visible dip that propagates as ripples. After ~2–3 seconds the text shows `[IDLE]`. A second click immediately removes `[IDLE]`.

---

## Section 2 — Auto-Waves Toggle

**What this tests:** `SetAutoWavesEnabled`, `IsAutoWavesEnabled`, `AutoWaveEnabled` expression, idle bypass.

```
Event: BtnAutoWave → On clicked
  Condition: WaterMain → Auto-waves is enabled
    Action: WaterMain → Set auto-waves enabled -> false
    Action: BtnAutoWave → Set text -> "Enable Auto-Wave"
  Condition: WaterMain → Auto-waves is not enabled
    Action: WaterMain → Set auto-waves enabled -> true
    Action: WaterMain → Set magnitude -> 4
    Action: WaterMain → Set period -> 2
    Action: WaterMain → Set wave length -> 200
    Action: BtnAutoWave → Set text -> "Disable Auto-Wave"

Event: Every tick
  Action: DebugText → Append text -> "  AutoWaveExp=" & WaterMain.AutoWaveEnabled
```

**Expected result:** Toggling the button enables/disables the continuous sine wave. When auto-waves are active, the `[IDLE]` marker never appears even after clicks settle.

---

## Section 3 — Parameter Tweaking at Runtime

**What this tests:** `SetTension`, `SetDampening`, `SetSpread`, `SetSpreadPassCount`.

```
// Keyboard shortcuts to cycle through presets.

Event: Keyboard → "1" pressed
  // Preset: Normal water
  Action: WaterMain → Set tension -> 0.025
  Action: WaterMain → Set dampening -> 0.025
  Action: WaterMain → Set spread -> 0.25
  Action: WaterMain → Set spread pass count -> 7
  Action: DebugText → Set text -> "Preset: Normal"

Event: Keyboard → "2" pressed
  // Preset: Choppy sea
  Action: WaterMain → Set tension -> 0.06
  Action: WaterMain → Set dampening -> 0.005
  Action: WaterMain → Set spread -> 0.35
  Action: WaterMain → Set spread pass count -> 12
  Action: DebugText → Set text -> "Preset: Choppy Sea"

Event: Keyboard → "3" pressed
  // Preset: Thick lava / oil
  Action: WaterMain → Set tension -> 0.006
  Action: WaterMain → Set dampening -> 0.1
  Action: WaterMain → Set spread -> 0.05
  Action: WaterMain → Set spread pass count -> 2
  Action: DebugText → Set text -> "Preset: Lava"

Event: Keyboard → "4" pressed
  // Preset: Very tight / quick decay
  Action: WaterMain → Set tension -> 0.08
  Action: WaterMain → Set dampening -> 0.08
  Action: WaterMain → Set spread -> 0.2
  Action: WaterMain → Set spread pass count -> 5
  Action: DebugText → Set text -> "Preset: Tight"
```

**Expected result:** After pressing a key and splashing (left click), the feel changes noticeably. Preset 2 should produce rings that travel far; preset 3 should barely move.

---

## Section 4 — Physics Auto-Force

**What this tests:** `SetPhysicsAutoForceEnabled`, `OnPhysicsImpact`, `ImpactX`, `ImpactForce`, `ImpactUID`.

```
Event: BtnPhysics → On clicked
  Condition: WaterMain → Physics auto-force is enabled
    Action: WaterMain → Set Physics auto-force enabled -> false
    Action: BtnPhysics → Set text -> "Enable Physics AF"
  Condition: WaterMain → Physics auto-force is not enabled
    Action: WaterMain → Set Physics auto-force enabled -> true
    Action: WaterMain → Set Physics force multiplier -> 0.4
    Action: WaterMain → Set Physics surface radius -> 30
    Action: BtnPhysics → Set text -> "Disable Physics AF"

Event: Keyboard → "B" pressed
  // Drop a Ball from above the water
  Action: Ball → Set position -> 400, 200
  Action: Ball → Physics → Set velocity -> 0, 0

Event: Keyboard → "C" pressed
  // Drop a Crate from above the water
  Action: Crate → Set position -> 400, 200
  Action: Crate → Physics → Set velocity -> 0, 0

Event: WaterMain → On Physics impact (UID filter: 0)
  // Fires once per entry into the surface zone.
  Action: SplashEffect → Create at -> WaterMain.ImpactX, WaterMain.SurfaceY(WaterMain.ImpactX)
  Action: DebugText → Set text ->
    "IMPACT! X=" & int(WaterMain.ImpactX) &
    "  Force=" & round(WaterMain.ImpactForce) &
    "  UID=" & WaterMain.ImpactUID
```

**Expected result:** With Physics AF enabled, dropping Ball or Crate above the water causes a splash sized by entry speed. The debug text shows the impact coordinates and force. With AF disabled, no automatic splash occurs — only manual `ApplyForce` calls work.

---

## Section 5 — Surface Query (SurfaceY)

**What this tests:** `SurfaceY` expression, real-time surface tracking.

```
Event: Every tick
  // ProbeMarker tracks surface at a fixed X = 400
  Action: ProbeMarker → Set Y -> WaterMain.SurfaceY(400)

  // Cork rides the surface at its own X
  Action: Cork → Set Y -> WaterMain.SurfaceY(Cork.X) - Cork.Height / 2

Event: Mouse → On right button clicked
  Condition: Mouse is over WaterMain
  // Teleport Cork to click position along the surface
  Action: Cork → Set X -> Mouse.X
```

**Expected result:** ProbeMarker bobs up and down as ripples pass under X=400. Cork follows the surface smoothly wherever it is dragged.

---

## Section 6 — Mesh Rebuild

**What this tests:** `SetMeshColumns`, `SetMeshRows`, wave-state resampling.

```
Event: BtnRebuild → On clicked
  // Apply force first so there's something to resample.
  Action: WaterMain → Apply Force -> 400, -80, 50
  // Wait one tick then rebuild to a different column count.

Event: BtnRebuild → On clicked (after 1 tick delay via System → Wait)
  Action: WaterMain → Set mesh columns -> 32
  Action: DebugText → Set text -> "Rebuilt to 32 columns. Columns=" & WaterMain.MeshColumns

Event: Keyboard → "R" pressed
  // Restore full resolution
  Action: WaterMain → Set mesh columns -> 64
  Action: DebugText → Set text -> "Restored to 64 columns."

Event: Keyboard → "T" pressed
  // Test row change
  Action: WaterMain → Set mesh rows -> 4
  Action: DebugText → Set text -> "Rows=" & WaterMain.MeshRows

Event: Keyboard → "Y" pressed
  Action: WaterMain → Set mesh rows -> 2
  Action: DebugText → Set text -> "Rows=" & WaterMain.MeshRows
```

**Expected result:** After the rebuild to 32 columns the ripple shape is visually preserved (resampled). The debug text shows the new column count. Row changes do not affect the surface wave shape.

---

## Section 7 — Idle Detection & Threshold

**What this tests:** `SetIdleThreshold`, `IsIdle`, idle state transitions.

```
Event: Keyboard → "I" pressed
  // Disable idle detection — water never stops ticking.
  Action: WaterMain → Set idle threshold -> 0
  Action: DebugText → Set text -> "Idle threshold: 0 (disabled)"

Event: Keyboard → "O" pressed
  // Restore idle detection.
  Action: WaterMain → Set idle threshold -> 0.01
  Action: DebugText → Set text -> "Idle threshold: 0.01"

Event: Keyboard → "P" pressed
  // Aggressive threshold — water idles almost immediately.
  Action: WaterMain → Set idle threshold -> 5.0
  Action: DebugText → Set text -> "Idle threshold: 5.0 (aggressive)"

Event: WaterMain → Simulation is idle
  Action: DebugText → Append text -> " | STATE: IDLE"

Event: WaterMain → Simulation is not idle
  Action: DebugText → Append text -> " | STATE: ACTIVE"
```

**Expected result:** With threshold 0, the simulation runs indefinitely. With 5.0, the water becomes idle almost immediately after a splash. Text updates confirm state transitions.

---

## Section 8 — Narrow Water Body (WaterNarrow)

**What this tests:** A second independent water instance with different properties.

```
Event: Mouse → On left button clicked
  Condition: Mouse is over WaterNarrow
  Action: WaterNarrow → Apply Force -> Mouse.X, -60, 15
  // Smaller splash for a smaller body of water.

Event: Every tick
  Action: DebugText → Append text ->
    "  Narrow idle=" & WaterNarrow.IsIdle
```

**Expected result:** Clicking WaterNarrow produces splashes that are visually independent from WaterMain. The narrower object with 16 columns and higher dampening should produce a slower, more viscous response.

---

## Section 9 — Stress Test (Rapid Forces)

**What this tests:** Rapid repeated forces, idle recovery after burst.

```
Event: Keyboard → "S" pressed
  // Rapid-fire forces across the surface
  Repeat 10 times:
    Action: WaterMain → Apply Force ->
      WaterMain.BBoxLeft + random(WaterMain.Width),
      -50 - random(100),
      10 + random(30)

Event: Every tick (while Keyboard.IsKeyDown("S"))
  Action: WaterMain → Apply Force ->
    WaterMain.BBoxLeft + random(WaterMain.Width),
    -random(80),
    15
```

**Expected result:** Holding S creates chaotic turbulence across the entire surface. Releasing S should allow the surface to gradually settle within 3–5 seconds (default dampening). No visual glitches or explosions.

---

## Section 10 — Save and Load (C3 Snapshot)

**What this tests:** `_saveToJson` / `_loadFromJson` via C3's built-in save system.

```
Event: Keyboard → "F5" pressed
  Action: System → Save state to slot -> "test_slot"
  Action: DebugText → Set text -> "State saved."

Event: Keyboard → "F9" pressed
  Action: System → Load state from slot -> "test_slot"
  Action: DebugText → Set text -> "State loaded."
```

**How to test:**
1. Start the layout.
2. Press left click to create a ripple.
3. Within the first second (while ripples are visible), press **F5** to save.
4. Wait for the water to settle to idle.
5. Press **F9** to load.
6. The ripple state at the moment of save should be restored — the waves should be visible and propagating again.

**Expected result:** Wave heights, velocities, and all parameters are restored exactly. The simulation resumes from the saved state. The idle state also restores — if saved while idle, it resumes idle.

---

## Section 11 — C3 Script Test

**What this tests:** Script-accessible actions and event listener.

Add a **Script** object to the project and paste the following into its script file:

```js
runOnStartOfLayout(() => {
  const runtime = this;

  // Get the water behavior
  const [waterInst] = runtime.objects.WaterMain.getAllInstances();
  const water = waterInst.behaviors["2DWater"];

  // Test all exposed actions
  water.SetTension(0.025);
  water.SetDampening(0.025);
  water.SetSpread(0.25);
  water.SetSpreadPassCount(7);
  water.SetIdleThreshold(0.01);
  water.SetAutoWavesEnabled(false);
  water.SetWaveLength(150);
  water.SetPeriod(2);
  water.SetMagnitude(2);
  water.SetPhysicsAutoForceEnabled(false);
  water.SetPhysicsForceMultiplier(1.0);
  water.SetPhysicsSurfaceRadius(20);

  // Apply a programmatic splash after 1 second
  setTimeout(() => {
    water.ApplyForce(400, -100, 40);
    console.log("Script splash applied at x=400");
  }, 1000);

  // Listen for Physics impacts
  water.addEventListener("OnPhysicsImpact", () => {
    const x     = water._impactX;
    const force = water._impactForce;
    const uid   = water._impactUID;
    console.log(`[Script] Physics impact: x=${x.toFixed(1)} force=${force.toFixed(1)} uid=${uid}`);
  });

  console.log("[Script] 2DWater scripting test ready.");
});
```

**Expected result:** After 1 second a splash appears at X=400 with no event sheet involvement. When Physics objects hit the water (with AF enabled), the browser console logs the impact data.

---

## Section 12 — Edge Cases

### Out-of-bounds SurfaceY

```
Event: Keyboard → "E" pressed
  // X outside the water's horizontal bounds should return bbox.top.
  Local variable: outsideY = WaterMain.SurfaceY(-9999)
  Local variable: bboxTop  = WaterMain.BBoxTop
  Action: DebugText → Set text ->
    "SurfaceY(-9999)=" & outsideY & "  BBoxTop=" & bboxTop &
    "  Match=" & (outsideY = bboxTop ? "YES" : "NO")
```

**Expected result:** `outsideY` equals `BBoxTop`. "Match=YES".

---

### Zero-force ApplyForce (no-op wakeup)

```
Event: Keyboard → "Z" pressed
  // Force of 0 should wake a sleeping simulation without disturbing the surface.
  Action: WaterMain → Apply Force -> 400, 0, 20
  Action: DebugText → Set text -> "Zero force applied. Idle=" & WaterMain.IsIdle
```

**Expected result:** If the simulation was idle, this wakes it (it briefly becomes not-idle) but the surface is undisturbed. It re-idles almost immediately.

---

### Extreme tension (instability check)

```
Event: Keyboard → "X" pressed
  Action: WaterMain → Set tension -> 0.5
  Action: WaterMain → Apply Force -> 400, -50, 20
  Action: DebugText → Set text -> "High tension (0.5) — expect fast decay"

Event: Keyboard → "V" pressed
  // Restore safe tension
  Action: WaterMain → Set tension -> 0.025
  Action: DebugText → Set text -> "Tension restored to 0.025"
```

**Expected result:** Very high tension (0.5) causes very rapid, stiff oscillation. It should not explode or crash — columns should oscillate quickly and decay. If the surface does blow up, note the threshold and add it to the known-limits documentation.

---

### Spread at maximum (0.5)

```
Event: Keyboard → "W" pressed
  Action: WaterMain → Set spread -> 0.5
  Action: WaterMain → Apply Force -> 400, -80, 10
  Action: DebugText → Set text -> "Spread=0.5 (max safe)"

Event: Keyboard → "Q" pressed
  Action: WaterMain → Set spread -> 0.25
  Action: DebugText → Set text -> "Spread restored to 0.25"
```

**Expected result:** At 0.5, disturbances travel very fast across the entire surface. Still stable. Values above 0.5 are not tested here — see tip in Guide.md.

---

## Test Checklist

Copy this checklist into your testing notes and mark each item when verified:

```
[ ] Section 1:  Left click creates a visible splash and ripples propagate
[ ] Section 1:  IDLE text appears after ripples settle (~2-3s)
[ ] Section 1:  A second click immediately clears IDLE
[ ] Section 2:  Auto-wave toggle button switches wave on/off
[ ] Section 2:  With auto-waves on, IDLE never appears
[ ] Section 3:  Each preset (1/2/3/4) produces a visually distinct feel
[ ] Section 4:  Dropping Ball/Crate (with AF on) triggers OnPhysicsImpact
[ ] Section 4:  Debug text shows correct ImpactX, ImpactForce, ImpactUID
[ ] Section 4:  With AF off, no automatic splash on Physics object entry
[ ] Section 5:  ProbeMarker bobs up and down with the wave at X=400
[ ] Section 5:  Cork follows surface on right-click teleport
[ ] Section 6:  Rebuild to 32 columns preserves ripple shape
[ ] Section 6:  Debug text confirms column count change
[ ] Section 6:  Restoring to 64 works correctly
[ ] Section 7:  Threshold 0 keeps simulation ticking indefinitely
[ ] Section 7:  Threshold 5.0 causes near-instant idle
[ ] Section 8:  WaterNarrow responds independently to clicks
[ ] Section 9:  Rapid forces (S key) produce chaotic turbulence without crash
[ ] Section 9:  Surface settles cleanly after releasing S
[ ] Section 10: Save (F5) then Load (F9) restores wave state visually
[ ] Section 11: Script splash appears at X=400 after 1s (check console)
[ ] Section 11: Physics impact logs appear in console with correct data
[ ] Section 12: SurfaceY(-9999) equals BBoxTop (Match=YES)
[ ] Section 12: Zero-force ApplyForce does not disturb the surface
[ ] Section 12: High tension (0.5) does not cause simulation explosion
[ ] Section 12: Spread 0.5 is stable (no growing oscillation)
```
