# 2DWater — Water Behavior Guide

**2DWater** is a Construct 3 behavior that turns any **Tiled Background** or **Sprite** object into an interactive liquid surface. It deforms the object's mesh in real time using a spring-damper simulation: each point along the top edge of the object is an independent spring that bounces, decays, and pushes energy to its neighbours. The result is rippling, splashing water that responds to `ApplyForce` calls, automatic Physics-behavior collision detection, or continuous sinusoidal auto-waves — with zero renderer code to write and no external libraries to include.

---

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [Project Setup](#2-project-setup)
3. [Properties Reference](#3-properties-reference)
4. [Simulation Physics](#4-simulation-physics)
5. [Auto-Waves](#5-auto-waves)
6. [Physics Auto-Force](#6-physics-auto-force)
7. [Mesh Control](#7-mesh-control)
8. [Performance & Idle Detection](#8-performance--idle-detection)
9. [Actions Reference](#9-actions-reference)
10. [Conditions Reference](#10-conditions-reference)
11. [Expressions Reference](#11-expressions-reference)
12. [Triggers Reference](#12-triggers-reference)
13. [System Use Cases](#13-system-use-cases)
14. [Game Use Cases](#14-game-use-cases)
15. [C3 Debugger](#15-c3-debugger)
16. [Scripting (C3 Script / JavaScript)](#16-scripting-c3-script--javascript)
17. [Tips and Common Mistakes](#17-tips-and-common-mistakes)

---

## 1. Core Concepts

### The problem this addon solves

Creating believable water in Construct 3 normally involves either hand-animated sprites (which can't respond to in-game events), shader effects (which require WebGL knowledge and can't easily feed back surface positions to game logic), or full physics simulations (far too expensive for a decorative surface). 2DWater sits in the sweet spot: a lightweight 1D spring chain simulates only the top edge of the object, and the result is applied to a mesh that C3 already knows how to render. No shader code, no extra objects, one behavior on one existing sprite or background tile.

### Key design decisions

- **One behavior, one surface.** Each instance of the behavior manages exactly one host object. Attach the behavior to as many water objects as you need.
- **Host-type detection is automatic.** The behavior detects whether the host is a `TiledBackground` or a `Sprite` at startup and applies the correct draw-patch strategy. You do not need to tell it which type you are using.
- **Idle detection stops the tick.** When all column velocities fall below the **idle threshold**, the behavior stops calling `_tick()` entirely. It resumes the moment any force is applied or auto-waves are enabled. This means static water costs nothing.
- **Physics auto-force is opt-in.** The Physics collision scan runs only when you enable the **Auto Physics Force** property or action. If you prefer to call `ApplyForce` manually, leave it disabled.

### Key concepts at a glance

| Term | Meaning |
|---|---|
| **Column** | One simulated spring point on the top edge of the water object. More columns = smoother but more expensive. |
| **Tension** | Spring stiffness — how hard each column pulls back toward its rest position. |
| **Dampening** | Energy decay — how quickly oscillation dies down. Think viscosity. |
| **Spread** | Lateral propagation rate — how fast a disturbance travels horizontally to neighbouring columns. |
| **Auto-Wave** | A continuous sinusoidal target applied to every column, producing ambient wave motion without any `ApplyForce` calls. |
| **Surface Zone** | The thin band (above and below the water top edge) that Physics objects must enter to trigger an automatic splash. |

### Scenarios where this addon excels

- **Decorative background water** — rivers, lakes, or ocean panels that gently ripple on their own using auto-waves. Because idle detection halts ticking when untouched, off-screen or static panels cost essentially nothing.
- **Interactive platformer puddles** — a player lands, and the puddle responds with a splash that radiates outward. Feed the player's bounding-box X to `ApplyForce` on collision.
- **Falling objects** — any Physics-behavior object (a rock, a crate, a fish) that hits the water surface automatically triggers a splash sized by its vertical velocity. No event sheet code required.
- **Lava / acid / goo** — tweak tension and dampening for heavy, slow-moving surfaces rather than water. The physics model is material-agnostic.
- **Surface tracking** — the `SurfaceY` expression returns the live world-Y of the water at any X coordinate. Attach floating objects, draw buoyancy sprites, or test whether a character is submerged.
- **Cutscenes and transitions** — enable auto-waves programmatically when a scene starts, then disable them when it ends, without touching the project's Physics simulation at all.
- **Multiple water bodies** — deep water in the background with slow, wide waves; shallow water in the foreground with tight, rapid ripples. Each instance carries its own parameters.

---

## 2. Project Setup

### Step 1 — Add the behavior

1. In the Construct 3 editor, place a **Tiled Background** or **Sprite** object on your layout and size it to match your water body.
2. Right-click the object in the Objects panel → **Edit behaviors** → **Add behavior** → search for **2DWater** → click Add.
3. The behavior appears in the Properties Bar under the object. You can set all parameters here before running the project.

### Step 2 — Set the initial shape

The water starts flat. Every column is at the same height as the top edge of the host object. For most setups you do not need to do anything — the rest height is taken from `GetHeight()` at startup.

> **Tip:** Make sure the host object is sized correctly in the editor. If you resize it at runtime before the first tick, update `_targetHeight` accordingly — or simply set `ApplyForce` to re-level the surface.

### Step 3 — Your first splash

Add this to the event sheet to make the water respond when the player lands:

```
Event: Player → On landed (Platform behavior)
  Action: Water → ApplyForce -> Player.X, -80, 40
  // Negative force = push down; positive = push up.
  // Radius of 40 pixels spreads the splash over roughly two body-widths.
```

### Step 4 — Verify it looks right

Run the project. The water should dip at the player's X position and then ripple outward and decay. If the ripples die too fast, reduce **Dampening**. If they feel stiff and choppy, reduce **Tension**. If the wave barely spreads, increase **Spread** or **Spread Pass Count**.

### Step 5 — (Optional) Enable auto-waves for ambient motion

Check **Enable Auto-Waves** in the Properties Bar to add continuous background oscillation. Adjust **Wave Length**, **Period**, and **Magnitude** to taste.

---

## 3. Properties Reference

All properties can be read from the Properties Bar and changed at runtime via their corresponding `Set…` actions.

| Property | Type | Default | Description |
|---|---|---|---|
| **Tension** | Float | `0.025` | Spring stiffness. Low values (0.005–0.015) produce slow, wide waves. High values (0.05+) produce tight, fast ripples. |
| **Dampening** | Float | `0.025` | Energy decay per tick. Near-zero values let ripples ring for a long time. Values above 0.1 produce thick, viscous movement. |
| **Spread** | Float | `0.25` | Fraction of height difference transferred to neighbours each spread pass. Range 0–0.5; values above 0.5 can cause instability. |
| **Mesh Columns** | Integer | `64` | Number of simulated columns (minimum 2). Higher = smoother surface. Each column is one spring. |
| **Mesh Rows** | Integer | `2` | Number of mesh rows. Only row 0 (the top edge) is deformed. Minimum 2. Increase for perspective effects. |
| **Enable Auto-Waves** | Check | `false` | Continuously drives sinusoidal surface motion. Bypasses idle detection while active. |
| **Wave Length** | Integer | `150` | Spatial wavelength of auto-waves in pixels. Smaller = more peaks visible across the surface. |
| **Period** | Float | `2` | Duration in seconds of one full auto-wave cycle. Smaller = faster oscillation. `0` freezes phase. |
| **Magnitude** | Integer | `2` | Amplitude of auto-waves in pixels above the rest position. |
| **Auto Physics Force** | Check | `false` | When checked, Physics-behavior objects that enter the surface zone automatically cause a splash. |
| **Physics Force Multiplier** | Float | `1.0` | Scales the impacting object's vertical velocity to a force magnitude. Increase for more dramatic splashes. |
| **Physics Surface Radius** | Integer | `20` | Horizontal splash radius in pixels for automatic Physics impacts. |
| **Surface Detection Depth** | Integer | `16` | Half-height of the surface zone in pixels. Objects whose bounding box overlaps this band are considered candidates. |
| **Idle Threshold** | Float | `0.01` | Maximum column speed (px/tick) at which the simulation is considered at rest. `0` disables idle detection entirely. |
| **Spread Pass Count** | Integer | `7` | Spread iterations per tick. More passes = disturbances travel farther per frame. Clamped 1–16. |

---

## 4. Simulation Physics

### How the spring-damper works

The 2DWater simulation treats the top edge of the host object as a row of independent vertical springs. Each spring (column) stores a **displacement** (how far it has moved from rest) and a **velocity** (how fast it is moving). Every tick, two passes run:

1. **Spring-damper pass** — Each column's acceleration is computed as:

   ```
   acceleration = −tension × displacement − dampening × velocity
   ```

   This is a classic [damped harmonic oscillator](https://en.wikipedia.org/wiki/Harmonic_oscillator). `tension` acts as the spring constant (k) and `dampening` acts as the damping coefficient (c). The column velocity and displacement are then updated by that acceleration.

2. **Spread pass** — Each column computes the height difference to its left and right neighbours and transfers a fraction (`spread`) of that difference as a velocity impulse. This is repeated `spreadPassCount` times per tick to allow disturbances to propagate further.

After both passes, the mesh points are written to the C3 world, and the renderer draws the deformed object.

### Tuning the feel

| Effect desired | Adjust |
|---|---|
| Waves die out quickly | Increase Dampening |
| Waves ring for a long time | Decrease Dampening |
| Ripples are fast and tight | Increase Tension |
| Ripples are slow and rolling | Decrease Tension |
| Disturbance stays localised | Decrease Spread or Spread Pass Count |
| Disturbance travels far | Increase Spread or Spread Pass Count |
| Thick lava / oil feel | High Dampening (0.08+), Low Tension (0.005–0.01), Low Spread |
| Choppy sea | High Tension (0.05+), Low Dampening (0.005–0.01), High Spread |

### Applying a force manually

```
Event: Mouse → On left button clicked
  Action: Water → ApplyForce -> Mouse.X, -60, 30
  // Clicks the surface down with a 30px radius splash.
  // Negative force = downward displacement → wave rises back up.
```

The `force` parameter is added directly to the column velocities at the impact position. Negative values push the surface down (which then rebounds up); positive values push it up. Typical usable ranges are ±20 to ±200 depending on your Tension setting.

### Why mesh rows must be at least 2

C3's mesh system requires a minimum of 2 rows. The simulation only deforms **row 0** (the top edge). Rows below that remain at their default positions, which creates the solid lower body of the water. If you increase `Mesh Rows`, the additional rows are evenly distributed between the top and bottom edges and remain static.

---

## 5. Auto-Waves

Auto-waves continuously drive sinusoidal oscillation on the surface without any `ApplyForce` calls. This is ideal for ambient water that needs to look alive without game logic involvement.

### How the phase works

Each tick, a global `phase` accumulator advances by `dt / period`. This phase is fed into the sine function:

```
columnTarget = restHeight + sin((columnFraction × width / waveLength × 2π) − phase × 2π) × magnitude
```

Each column's target position oscillates independently based on its position along the surface. The result is a travelling wave that moves from left to right.

### Enabling auto-waves

Check **Enable Auto-Waves** in Properties Bar, or at runtime:

```
Event: Start of layout
  Action: Water → Set auto-waves enabled -> true
  Action: Water → Set magnitude -> 4
  Action: Water → Set period -> 1.5
  Action: Water → Set wave length -> 200
```

### Interaction with manual forces

Auto-waves and manual `ApplyForce` are additive. You can have auto-waves running as a base layer while still triggering splashes. The spring-damper continues to apply dampening to the difference from the sinusoidal target, so the extra energy from a splash decays naturally on top of the wave motion.

### Bypassing idle detection

When auto-waves are active, idle detection is **not** evaluated. The behavior will keep ticking even if wave amplitude is tiny. Disable auto-waves when you no longer need them to allow the idle check to eventually halt ticking.

```
Event: Button clicked "Calm water"
  Action: Water → Set auto-waves enabled -> false
  // Idle detection now active; ticking will stop once all columns settle.
```

---

## 6. Physics Auto-Force

Physics Auto-Force watches all Physics-behavior objects in the layout. When one enters the **surface zone** (a horizontal band at the top of the water), the behavior automatically computes a splash force from the object's vertical velocity and calls `ApplyForce` internally.

### The surface zone

The surface zone is centred on the top edge of the water object and extends `surfaceDetectionDepth` pixels above and below it. An object is considered to have entered the zone when its bounding box overlaps this band on the current tick but did not overlap it on the previous tick.

```
zoneTop = water.bbox.top - surfaceDetectionDepth
zoneBtm = water.bbox.top + surfaceDetectionDepth
```

### Force calculation

```
force = physics.velocityY × physicsForceMultiplier
```

A typical falling rock might have `velocityY ≈ 300 px/s`. With `physicsForceMultiplier = 0.5` the force applied is `150`. Tune the multiplier until splashes feel proportional to the object's visual weight.

### Enabling and listening to impacts

```
Event: Start of layout
  Action: Water → Set Physics auto-force enabled -> true
  Action: Water → Set Physics force multiplier -> 0.5
  Action: Water → Set Physics surface radius -> 30

Event: Water → On Physics impact (UID filter: 0)
  // Fires once per object per entry into the surface zone.
  // UID filter 0 = any object.
  Action: SplashParticles → Spawn at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
  Action: DebugText → Set text -> "Impact! Force=" & Water.ImpactForce
```

### Filtering by specific object

Pass the object's UID to `OnPhysicsImpact` to react only to a particular instance:

```
Event: Water → On Physics impact (UID filter: Rock.UID)
  Action: RockSplashEffect → Spawn
```

### What counts as a Physics object

The behavior scans **every object type** in the layout on each tick (when auto-force is enabled) and checks whether the instance has a **Physics behavior** attached. Objects without a Physics behavior are skipped immediately and cached as "no Physics" so the check is fast after the first scan.

> **Important:** The scan covers all object types in the layout. For best performance, keep Auto Physics Force disabled when the water is off-screen or when no Physics objects are present.

---

## 7. Mesh Control

### Why you might change the mesh

The default 64 columns gives a smooth surface for most screen-width water. For narrow puddles (under 200px wide) you might drop to 16–32 columns. For very wide panoramic water (2000px+) you might increase to 128 or 256.

Rows are rarely changed at runtime. The main reason to increase rows is if you want to add perspective depth effects — a tallscreen water surface where the lower rows are also deformed by a shader or tween.

### Changing columns at runtime

```
Event: Player enters shallow water area
  Action: ShallowWater → Set mesh columns -> 16
  // Wave state is linearly resampled — the ripple shape is preserved.
```

Wave state (displacement and velocity of each column) is **linearly resampled** when you change the column count. This means existing ripples survive the resize without snapping or glitching. However, a rebuild is not cheap — do not call `SetMeshColumns` every tick.

### Changing rows at runtime

```
Event: Cinematic begins
  Action: Water → Set mesh rows -> 4
  // Only the row count changes; columns and wave state are unaffected.
```

---

## 8. Performance & Idle Detection

### Idle detection

When the surface settles, the behavior automatically stops ticking. It resumes the moment any force is applied or auto-waves are enabled. This means a calm lake that nobody is interacting with costs zero CPU.

The **Idle Threshold** property controls how sensitive idle detection is. The default `0.01` px/tick is appropriate for most uses. Set to `0` to disable idle detection entirely (e.g. for physics-driven surfaces that must always be responsive).

```
Event: Button "Freeze water"
  Action: Water → Set idle threshold -> 0
  // The simulation will now tick forever even when perfectly calm.

Event: Button "Normal water"
  Action: Water → Set idle threshold -> 0.01
```

### Checking idle state from the event sheet

```
Event: Water → Simulation is idle
  Action: WaterGlowEffect → Set opacity -> 0
  // Turn off an effect when water is static.
```

### Spread pass count

More spread passes per tick allow disturbances to travel farther within a single frame, which produces a smoother, more natural-looking propagation. Lower counts mean disturbances feel more "local" and die faster. For background water that never needs to propagate ripples far, dropping to 3–4 passes is a free performance saving.

```
Event: Water is background (far layer)
  Action: BgWater → Set spread pass count -> 3
  // Roughly halves the simulation cost vs. default of 7.
```

---

## 9. Actions Reference

### Simulation Control

| Action | Description |
|---|---|
| **Apply Force** `(x, force, radius)` | Pushes the surface up or down at a world X position. Negative force = push down (which bounces back up). Radius controls how many pixels wide the splash is. |
| **Set Tension** `(value)` | Changes spring stiffness. Low = slow rolling waves. High = tight fast ripples. |
| **Set Dampening** `(value)` | Changes energy decay. Low = long-ringing waves. High = quick-dying ripples. |
| **Set Spread** `(value)` | Changes lateral propagation rate. Controls how far a disturbance travels sideways. |

### Mesh Control

| Action | Description |
|---|---|
| **Set Mesh Columns** `(columns)` | Rebuilds the mesh with a new column count. Wave state is resampled. Minimum 2. Avoid calling every tick. |
| **Set Mesh Rows** `(rows)` | Rebuilds the mesh with a new row count. Minimum 2. Only the top row is deformed. |

### Wave Control

| Action | Description |
|---|---|
| **Set Auto-Waves Enabled** `(enabled)` | Turns continuous sinusoidal wave motion on or off. |
| **Set Wave Length** `(pixels)` | Changes the spatial wavelength of auto-waves. |
| **Set Period** `(seconds)` | Changes how long one auto-wave cycle takes. `0` freezes the wave. |
| **Set Magnitude** `(pixels)` | Changes the peak amplitude of auto-waves. |

### Physics Auto-Force

| Action | Description |
|---|---|
| **Set Physics Auto-Force Enabled** `(enabled)` | Turns automatic Physics splash detection on or off. Disabling clears all tracked instances. |
| **Set Physics Force Multiplier** `(value)` | Scales how much force an impacting object's vertical velocity generates. |
| **Set Physics Surface Radius** `(pixels)` | Changes the horizontal splash radius for Physics auto-impacts. |

### Performance

| Action | Description |
|---|---|
| **Set Idle Threshold** `(value)` | Changes the minimum column speed for idle detection. `0` disables it. |
| **Set Spread Pass Count** `(count)` | Changes lateral spread iterations per tick. Clamped to 1–16. |

---

## 10. Conditions Reference

| Condition | Description |
|---|---|
| **Auto-waves is enabled** | True when auto-wave oscillation is currently active. Invertible. |
| **Physics auto-force is enabled** | True when Physics splash detection is currently active. Invertible. |
| **Simulation is idle** | True when the simulation has stopped ticking because all columns settled below the idle threshold. Invertible. |

---

## 11. Expressions Reference

| Expression | Returns | Description |
|---|---|---|
| `SurfaceY(x)` | Number | World Y of the water surface at world X coordinate `x`. Returns `bbox.top` if `x` is outside the object's horizontal bounds. |
| `MeshColumns` | Number | Current number of simulation columns. |
| `MeshRows` | Number | Current number of mesh rows. |
| `AutoWaveEnabled` | Number | `1` if auto-waves are active, `0` if not. |

---

## 12. Triggers Reference

| Trigger | Description |
|---|---|
| **On Physics impact** `(instanceUID)` | Fires once per Physics instance per surface-zone entry. Pass `0` as the UID filter to receive impacts from any object. Pass a specific UID to filter for one instance. |

### Impact Context expressions

These expressions are only valid **inside** an `On Physics impact` handler:

| Expression | Returns | Description |
|---|---|---|
| `ImpactX` | Number | World X of the impact point. |
| `ImpactForce` | Number | The force magnitude applied to the surface. |
| `ImpactUID` | Number | UID of the Physics instance that caused the impact. |

---

## 13. System Use Cases

### Simulation Control system

The simulation control system governs the spring-damper physics that make the water move. Its three tunable parameters — tension, dampening, and spread — can be changed at any time, even mid-simulation.

**Scenario A — Runtime parameter change on game event**

```
Event: Player picks up "Thick Potion" item
  Action: Water → Set dampening -> 0.12
  Action: Water → Set tension -> 0.008
  // Water becomes slow and viscous while the potion is active.

Event: Potion timer expires
  Action: Water → Set dampening -> 0.025
  Action: Water → Set tension -> 0.025
  // Restore normal water feel.
```

**Scenario B — Manual splash on any click/tap**

```
Event: Mouse → On left button clicked
  Action: Water → Apply Force -> Mouse.X, -100, 25
  // Splashes at cursor, 25px radius.
```

> Tip: Combine with `Water.SurfaceY(Mouse.X)` to spawn a particle effect at the exact surface point.

---

### Auto-Waves system

The auto-wave system generates continuous surface motion without event sheet actions every tick. It is ideal for any water body that should always look alive.

**Scenario A — Enable on layout start, disable in a cutscene**

```
Event: Start of layout
  Action: Water → Set auto-waves enabled -> true
  Action: Water → Set magnitude -> 3
  Action: Water → Set period -> 2

Event: Cutscene starts
  Action: Water → Set auto-waves enabled -> false
  // Water calms naturally due to dampening; no hard snap.
```

**Scenario B — Animate wave magnitude with a Tween**

Construct's Tween behavior can animate any numeric property. Use the `SetMagnitude` action inside a `Tween on step` event to smoothly fade waves in or out without writing any formula yourself.

```
Event: Player dives into water
  Action: Water → Set magnitude -> 0
  Repeat 30 times:
    Action: Water → Set magnitude -> loopindex * 0.33
    // Ramps from 0 to ~10 over 30 ticks — approx 0.5s at 60fps.
```

> Tip: Auto-waves bypass idle detection. Always disable them when the water should eventually go still.

---

### Physics Auto-Force system

This system watches Physics-behavior objects and converts their vertical entry velocity into a splash impulse automatically.

**Scenario A — Splash particle on any Physics impact**

```
Event: Water → On Physics impact (UID filter: 0)
  Action: Splash → Create object at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
  Action: Splash → Set angle -> -90  // upward burst
```

**Scenario B — Different effect for heavy vs. light objects**

```
Event: Water → On Physics impact (UID filter: 0)
  Condition: Water.ImpactForce > 100
    Action: BigSplash → Spawn at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
  Condition: Water.ImpactForce <= 100
    Action: SmallSplash → Spawn at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
```

**Scenario C — Disable auto-force when the level is paused**

```
Event: Game paused
  Action: Water → Set Physics auto-force enabled -> false

Event: Game unpaused
  Action: Water → Set Physics auto-force enabled -> true
```

> Tip: `ImpactForce`, `ImpactX`, and `ImpactUID` are only valid inside the `On Physics impact` handler. Reading them outside will return stale values from the previous impact.

---

### Surface Query system

`SurfaceY` lets you map any world X coordinate to the live position of the water surface. This feeds back into game logic — buoyancy, submerge detection, particle spawn positions.

**Scenario A — Floating object that rides the surface**

```
Event: Every tick
  Action: Cork → Set Y -> Water.SurfaceY(Cork.X) - Cork.Height / 2
  // Keeps the cork's bottom edge touching the water surface.
```

**Scenario B — Submerge detection**

```
Event: Player.Y > Water.SurfaceY(Player.X)
  Action: UnderwaterOverlay → Set visible -> true
  Action: Player → Apply underwater gravity modifier
```

---

### Idle Detection system

Idle detection automatically halts the simulation when the surface has settled, saving CPU for every frame the water is calm.

**Scenario A — Trigger an event when water calms**

```
Event: Water → Simulation is idle
  Action: WaterShimmer → Set animation -> "Still"
  // Switch to a lightweight ambient animation when physics are inactive.
```

**Scenario B — Force water to always tick (e.g. for a live demo)**

```
Event: Start of layout
  Action: Water → Set idle threshold -> 0
  // Disables idle check; simulation ticks every frame indefinitely.
```

---

## 14. Game Use Cases

### Use Case 1 — Simplest setup: a calm lake with auto-waves

**Scenario:** A top-down RPG has a decorative lake. It should gently undulate at all times but never needs to react to anything.

```
// Properties set in the editor:
// Enable Auto-Waves: checked
// Magnitude: 2
// Period: 3
// Wave Length: 300
// Spread Pass Count: 3  (background — save CPU)

// No event sheet code needed at all.
```

> The behavior starts auto-waving immediately. Because auto-waves bypass idle detection, the simulation ticks perpetually — exactly what a background lake needs.

---

### Use Case 2 — Platformer: splash on player landing

**Scenario:** A side-scrolling platformer where the player can land on water platforms. The water dips at the landing point and ripples outward.

```
Event: Player → On landed (Platform behavior)
  Condition: Player → Is overlapping Water
  Action: Water → Apply Force -> Player.X, -80, Player.Width / 2
  Action: SplashParticles → Spawn at -> Player.X, Water.SurfaceY(Player.X)
```

> `Player.Width / 2` as the radius means the splash covers roughly the player's footprint.

---

### Use Case 3 — Physics objects auto-splashing

**Scenario:** A puzzle game where crates and balls can be thrown into water. Each object should create a splash proportional to how fast it hits.

```
// Properties set in editor:
// Auto Physics Force: checked
// Physics Force Multiplier: 0.4
// Physics Surface Radius: 35

Event: Water → On Physics impact (UID filter: 0)
  Action: SplashEffect → Create at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
  Action: SplashSound → Play
```

---

### Use Case 4 — Surface-following boat

**Scenario:** A small boat sprite should bob along the water surface, its Y position tracking the live wave height.

```
Event: Every tick
  Local variable: surfY = Water.SurfaceY(Boat.X)
  Action: Boat → Set Y -> surfY - Boat.Height * 0.6
  Action: Boat → Set angle -> (Water.SurfaceY(Boat.X + 10) - Water.SurfaceY(Boat.X - 10)) * 2
  // Angle is approximated from the surface slope at the boat's position.
```

---

### Use Case 5 — Underwater submerge detection

**Scenario:** A 2D action game where falling into water triggers a "drowned" state.

```
Event: Player.Y + Player.Height * 0.5 > Water.SurfaceY(Player.X)
  Condition: Player → Is not in "Drowned" state
  Action: Player → Set state -> "Drowned"
  Action: DrownedUI → Set visible -> true
  Action: Water → Apply Force -> Player.X, -30, 20
  // Small residual ripple as player sinks.
```

---

### Use Case 6 — Viscous lava pool

**Scenario:** A platformer level has a lava pool that moves very slowly and heavily.

```
Event: Start of layout
  Action: Lava → Set tension -> 0.005
  Action: Lava → Set dampening -> 0.1
  Action: Lava → Set spread -> 0.08
  Action: Lava → Set spread pass count -> 2
  // Slow, thick, barely-propagating surface.

Event: Rock falls into Lava → On Physics impact (UID filter: 0)
  Action: Lava → Set Physics force multiplier -> 2.0
  // Heavy impacts make bigger impressions despite the low tension.
```

---

### Use Case 7 — Storm sequence: dynamic wave intensity

**Scenario:** A ship game where a storm event causes waves to grow progressively larger.

```
Event: Storm starts
  Action: Ocean → Set auto-waves enabled -> true
  Action: Ocean → Set magnitude -> 1
  Action: Ocean → Set period -> 1.5

Event: Every 2 seconds (while storm active)
  Condition: Ocean.AutoWaveEnabled = 1
  Action: Ocean → Set magnitude -> min(Ocean.Magnitude + 2, 20)
  Action: Ocean → Set period -> max(Ocean.Period - 0.1, 0.5)

Event: Storm ends
  Action: Ocean → Set auto-waves enabled -> false
  // Waves decay naturally thanks to dampening.
```

---

### Use Case 8 — Off-screen optimisation

**Scenario:** A large level has 6 water bodies. Only the ones on screen should simulate.

```
Event: Water is off screen
  Condition: Water → Simulation is not idle
  Action: Water → Set idle threshold -> 999
  // Forces idle state immediately by setting an extremely high threshold.
  // Wave state snaps to rest.

Event: Water enters screen
  Action: Water → Set idle threshold -> 0.01
  // Restore normal idle threshold; simulation restarts on next ApplyForce.
```

---

### Use Case 9 — Save and restore wave state

**Scenario:** A game with a save system needs the water surface state to persist across sessions.

The behavior includes `_saveToJson` / `_loadFromJson` which C3 calls automatically as part of its snapshot/restore mechanism. No event sheet code is needed — as long as you use C3's built-in **Save game** and **Load game** actions, wave heights, velocities, and all parameters are preserved exactly.

> If you implement a custom save system, note that the behavior saves `height[]` and `speed[]` as arrays alongside all scalar parameters. Your custom loader will need to handle the mesh rebuild before restoring wave data — call `ApplyForce` with force `0` to wake the simulation after a custom load.

---

### Use Case 10 — Transition between two water types

**Scenario:** The player crosses from a river (fast, shallow) into a deep ocean (slow, rolling). Both are the same `Water` object resized as they walk.

```
Event: Player enters "River" region
  Action: Water → Set tension -> 0.045
  Action: Water → Set dampening -> 0.03
  Action: Water → Set spread -> 0.3
  Action: Water → Set spread pass count -> 5

Event: Player enters "Ocean" region
  Action: Water → Set tension -> 0.008
  Action: Water → Set dampening -> 0.015
  Action: Water → Set spread -> 0.2
  Action: Water → Set spread pass count -> 9
```

---

### Use Case 11 — Particle splash with colour based on impact force

**Scenario:** Light touches create white foam; heavy crashes create a larger orange burst.

```
Event: Water → On Physics impact (UID filter: 0)
  Condition: Water.ImpactForce > 120
    Action: HeavySplash → Spawn at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
    Action: HeavySplash → Set blend color -> 255, 140, 0  // orange
  Condition: Water.ImpactForce <= 120 AND Water.ImpactForce > 0
    Action: LightSplash → Spawn at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
    Action: LightSplash → Set blend color -> 255, 255, 255  // white
```

---

### Use Case 12 — Ripple ring effect using SurfaceY

**Scenario:** After a splash, a series of concentric ring sprites should appear at the water surface.

```
Event: Water → On Physics impact (UID filter: 0)
  Action: RippleRing → Create at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
  Action: RippleRing (last created) → Set scale -> 0.1
  Action: RippleRing (last created) → Tween "scale" to -> 3.0 over 0.8s ease out
  Action: RippleRing (last created) → Tween "opacity" to -> 0 over 0.8s ease in
```

---

### Use Case 13 — Debug overlay showing live SurfaceY

**Scenario:** During development, you want to see the live surface height at a probe point.

```
Event: Every tick
  Action: DebugLabel → Set text -> "SurfaceY at 400px: " & Water.SurfaceY(400)
  Action: ProbeMarker → Set Y -> Water.SurfaceY(400)
  // A small sprite that tracks the surface for visual debugging.
```

---

### Use Case 14 — Resetting the surface instantly

**Scenario:** A level restart should clear any ripples and return the water to flat.

```
Event: Level restart
  Action: Water → Set auto-waves enabled -> false
  Action: Water → Set dampening -> 0.5  // aggressively kill energy
  // Wait 1 second, then restore normal dampening.

Event: Wait 1 second after level restart
  Action: Water → Set dampening -> 0.025
  Action: Water → Set auto-waves enabled -> true  // if desired
```

> There is no `ResetSurface` action, but driving the simulation with a very high dampening for a moment achieves the same result rapidly. Alternatively, call `SetMeshColumns` with the current column count — rebuilding the mesh also resets heights.

---

### Other game use cases

**Puzzle platformers.** Water bodies as interactive hazards — precise `SurfaceY` queries let the game code know exactly when a character is submerged vs. standing on the surface. Combine Physics auto-force with the trigger's `ImpactForce` to scale damage or sound effects by entry velocity.

**Metroidvania / exploration games.** Multiple named water bodies throughout the map, each with different physics parameters. The idle detection means off-screen bodies sleep for free. Bring them back to life with a single `ApplyForce` call when the player re-enters the area.

**Tower defence.** A moat that projectiles must cross. Projectiles with the Physics behavior create automatic visual ripples as they pass through the surface zone, adding battlefield atmosphere with zero extra event sheet code.

**Horror / atmospheric games.** Extremely high dampening and very low tension produce thick, slow fluid — perfect for swamps, sewage, or blood pools. Combine with dark colour tints on the Tiled Background and the surface barely moves even after a large force, contributing to a feeling of dread.

**Endless runners.** A water lane that the player jumps over. Auto-waves keep it visually dynamic even between interactions. `SurfaceY` at the player's X coordinate can feed into a "near miss" distance calculation.

**Top-down RPGs / adventure games.** Rivers, lakes, and coastlines that look alive without a physics simulation. Low magnitude auto-waves at a long wavelength create the impression of a real body of water scrolling past the player.

**Party / casual games.** Coin-throwing mechanics where the coin (Physics behavior) creates a distinct splash sound and particle on impact. The `OnPhysicsImpact` trigger and `ImpactForce` make it trivial to play the correct "plop" vs. "crash" sound depending on the throw speed.

---

## 15. C3 Debugger

### Opening the debugger

Press **F12** while the project is running in Construct 3 to open the Debugger panel. Find the host object's entry and expand it. The 2DWater sections appear under the object's behavior list.

### Debugger sections

The behavior reports five collapsible sections:

| Section | Contents |
|---|---|
| **2DWater — Physics** | Core spring parameters (Tension, Dampening, Spread). All three are live-editable. |
| **2DWater — Simulation** | Mesh Columns, Mesh Rows, Host Type (TiledBackground or Sprite), Is Idle flag, Spread Pass Count (editable). |
| **2DWater — Auto-Wave** | Enabled flag (toggle), Wave Length, Period, Magnitude. All editable. Toggling Enabled calls `SetAutoWavesEnabled` with side-effects. |
| **2DWater — Physics Force** | Auto Physics Force flag, Force Multiplier, Physics Surface Radius, Surface Detection Depth, Tracked Count (read-only count of objects currently in zone). |
| **2DWater — Performance** | Idle Threshold (editable). |

### Full field reference

| Field | Editable | Description |
|---|---|---|
| Tension | ✅ | Live spring stiffness |
| Dampening | ✅ | Live energy decay |
| Spread | ✅ | Live lateral propagation |
| Mesh Columns | ❌ | Column count (change via action) |
| Mesh Rows | ❌ | Row count (change via action) |
| Host Type | ❌ | "TiledBackground" or "Sprite" |
| Is Idle | ❌ | `true` when ticking is halted |
| Spread Pass Count | ✅ | Iterations per tick |
| Enabled (auto-wave) | ✅ | Toggles auto-waves live |
| Wave Length | ✅ | Spatial wavelength |
| Period | ✅ | Cycle duration (s) |
| Magnitude | ✅ | Peak amplitude (px) |
| Auto Physics Force | ❌ | Whether Physics scan is running |
| Force Multiplier | ✅ | Velocity-to-force scale |
| Physics Surface Radius | ✅ | Auto-impact splash radius |
| Surface Detection Depth | ✅ | Zone half-height |
| Tracked Count | ❌ | Objects currently in zone |
| Idle Threshold | ✅ | Idle speed threshold |

> All editable fields take effect immediately — the change is visible in the running layout without stopping the project.

---

## 16. Scripting (C3 Script / JavaScript)

### Accessing the behavior

The behavior name in script is derived from the **object's behavior name in the project** (the name shown in the Behaviors panel), not the addon ID. By default it is `2DWater`.

```js
const water = waterObj.behaviors["2DWater"];
```

If the user renames the behavior in the Behaviors panel (e.g. to `"River"`), use that name instead:

```js
const water = waterObj.behaviors.River;
```

### Calling actions from script

All actions with `expose: true` are copied directly onto the behavior's runtime prototype. The method name is PascalCase and matches the filename of the ACE (`a.ApplyForce.js` → `ApplyForce()`).

```js
// Apply a splash
water.ApplyForce(playerInst.x, -80, 30);

// Change physics feel
water.SetTension(0.01);
water.SetDampening(0.08);
water.SetSpread(0.15);

// Rebuild the mesh
water.SetMeshColumns(32);

// Auto-waves
water.SetAutoWavesEnabled(true);
water.SetWaveLength(200);
water.SetPeriod(1.5);
water.SetMagnitude(4);

// Physics auto-force
water.SetPhysicsAutoForceEnabled(true);
water.SetPhysicsForceMultiplier(0.5);
water.SetPhysicsSurfaceRadius(25);

// Performance
water.SetIdleThreshold(0.01);
water.SetSpreadPassCount(7);
```

All parameters are passed in the same order as the ACE's `params` array. There are no combo parameters in this addon.

### Reading state from script

Expressions are not callable from script. To read live simulation state, use the behavior's internal properties directly. These are prefixed with `_` (private by convention), so read the equivalent via the C3 expressions API or by calling the relevant expression as part of the behavior instance. Alternatively, the following properties are safe to read from script since they are updated every tick:

```js
// Current surface Y at a given world X
// (calls the SurfaceY expression logic — use the behavior directly)
function getSurfaceY(water, x) {
  const wi = water.instance.GetWorldInfo();
  if (!wi) return 0;
  const bbox = wi.GetBoundingBox();
  if (x < bbox.left || x > bbox.right) return bbox.top;
  const colWidth = wi.GetWidth() / (water._meshColumns - 1);
  const col = Math.max(0, Math.min(water._meshColumns - 1,
                       Math.round((x - bbox.left) / colWidth)));
  return water._displayY[col];
}

// Current column count
const cols = water._meshColumns;

// Is the simulation idle?
const idle = !water._isTicking();
```

> Prefer using C3 expressions in the event sheet for game logic. Accessing `_` properties from script is fine but relies on private API that could change with an addon update.

### Listening to triggers from script

```js
water.addEventListener("OnPhysicsImpact", (e) => {
  // e is the C3 trigger event — impact context is read via behavior properties
  const x     = water._impactX;
  const force = water._impactForce;
  const uid   = water._impactUID;
  console.log(`Impact at x=${x}, force=${force}, uid=${uid}`);
});
```

> The `0` UID-filter parameter in the event sheet is the condition's filter argument, not available as an event property. All `OnPhysicsImpact` script listeners fire for every impact regardless of UID — filter manually if needed.

### Complete example

```js
// Runs once at scene start — sets up a dynamic ocean that reacts to Physics objects
function setupOcean(runtime) {
  const [waterObj] = runtime.objects.Ocean.getAllInstances();
  const water = waterObj.behaviors["2DWater"];

  // Ambient waves
  water.SetAutoWavesEnabled(true);
  water.SetMagnitude(3);
  water.SetPeriod(2.5);
  water.SetWaveLength(350);

  // Physics auto-splashes
  water.SetPhysicsAutoForceEnabled(true);
  water.SetPhysicsForceMultiplier(0.4);
  water.SetPhysicsSurfaceRadius(30);

  // React to impacts
  water.addEventListener("OnPhysicsImpact", () => {
    const splashX = water._impactX;
    const surfY   = getSurfaceY(water, splashX);
    spawnSplashEffect(runtime, splashX, surfY);
  });
}
```

---

## 17. Tips and Common Mistakes

- **Do not call `SetMeshColumns` or `SetMeshRows` every tick.** These actions rebuild the entire mesh, which is expensive. Call them once on a state change (level start, area transition, etc.).

- **`ImpactX`, `ImpactForce`, and `ImpactUID` are only valid inside `On Physics impact`.** Reading them outside the trigger handler returns the values from the most recent impact, which may be stale by many frames.

- **Positive force pushes up; negative pushes down.** A stone dropping into water should use a negative force (the surface dips, then bounces back). A bubble surfacing from below would use a positive force.

- **Auto-waves bypass idle detection.** If you enable auto-waves and then later want the water to settle completely, you must explicitly call `Set auto-waves enabled → false` first. The idle threshold alone will not stop a ticking simulation with auto-waves active.

- **`Spread` above 0.5 can cause instability.** Values in the range 0.4–0.5 are already aggressive. Values above 0.5 may cause the simulation to produce growing oscillations rather than decaying ones. If you see the water "exploding", reduce Spread first.

- **The surface zone is based on the object's top edge at the time of the check.** If you move or scale the water object at runtime, the zone follows automatically because it reads `GetBoundingBox()` each tick.

- **Host type is detected once at `_onCreate`.** If you swap the host object's plugin type (not a normal use case), the draw patch will not adapt. Stick to TiledBackground or Sprite for the host, as designed.

- **For very narrow water objects (< 100px wide), use fewer columns.** 64 columns on a 60px puddle means columns are less than 1px apart, which wastes computation and can produce aliasing artifacts in the wave shape. Drop to 8–16 for narrow objects.

- **The mesh must have at least 2 rows.** Construct's mesh system does not support 1-row meshes. Requesting `SetMeshRows(1)` will silently clamp to 2.

- **Save/load is automatic.** C3's `Save game` and `Load game` system actions trigger `_saveToJson` / `_loadFromJson` on the behavior. All wave state and parameters are preserved. You do not need to manually save or restore any 2DWater state.
