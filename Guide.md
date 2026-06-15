# 2DWater — Water Behavior Guide

**2DWater** is a Construct 3 behavior that turns any **Tiled Background** or **Sprite** object into an interactive liquid surface. It deforms the object's mesh in real time using a spring-damper simulation: each point along the top edge of the object is an independent spring that bounces, decays, and pushes energy to its neighbours. The result is rippling, splashing water that responds to `ApplyForce` calls, automatic Physics-behavior collision detection, or continuous sinusoidal auto-waves.

---

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [Project Setup](#2-project-setup)
3. [Properties Reference](#3-properties-reference)
4. [Simulation Physics](#4-simulation-physics)
5. [Auto-Waves](#5-auto-waves)
6. [Physics Splash Settings](#6-physics-splash-settings)
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

- **One behavior, one surface.** Each instance of the behavior manages exactly one host object, and only one 2DWater behavior can be attached to any given object. Attach the behavior to as many separate water objects as you need.
- **Mesh deformation is bounds-driven.** The behavior writes mesh points against the host object's current bounding box every tick. Moving or resizing the host moves the water with it; there is no separate helper object to keep in sync.
- **Idle detection is conditional.** The behavior can stop calling `_tick()` when the surface settles, but only while both **auto-waves** and **auto-splash** are disabled. Any manual force wakes it again, and enabling either continuous system keeps it ticking.
- **Physics auto-splash is optional.** The Physics collision scan is controlled by the **Auto Physics Force** property and the **Set physics auto-splash enabled** action. It defaults on, but for purely decorative water you will usually want it off so idle shutdown can sleep the behavior.
- **Physics splash settings use layered overrides.** Automatic Physics values resolve in this order: **one instance override** → **object type default** → **water default**. This lets you keep one global setup while still making heavy rocks, light coins, or one boss object behave differently.

### Key concepts at a glance

| Term | Meaning |
|---|---|
| **Column** | One simulated spring point on the top edge of the water object. More columns = smoother but more expensive. |
| **Tension** | Spring stiffness — how hard each column pulls back toward its rest position. |
| **Dampening** | Energy decay — how quickly oscillation dies down. Think viscosity. |
| **Spread** | Lateral propagation rate — how fast a disturbance travels horizontally to neighbouring columns. |
| **Auto-Wave** | A continuous sinusoidal target applied to every column, producing ambient wave motion without any `ApplyForce` calls. |
| **Force Multiplier** | How strongly an automatic Physics hit disturbs the water. This scales the incoming vertical velocity into a wave force. |
| **Surface Radius** | How wide an automatic Physics splash spreads across the surface. |
| **Override Order** | One instance override first, then object type default, then water default. |
| **Physics Overlap** | The overlap check between a Physics object and the water object's bounds that triggers an automatic splash. |

### Scenarios where this addon excels

- **Decorative background water** — rivers, lakes, or ocean panels that either ripple on their own using auto-waves or sleep completely with auto-splash disabled when untouched.
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

> **Note:** Only one 2DWater behavior can be attached to any single object. To have multiple water surfaces, place multiple objects and attach one behavior to each.

### Step 2 — Set the initial shape

The water starts flat. Every column begins aligned to the top edge of the host object when the mesh is created. For most setups you do not need to do anything else.

> **Tip:** If you resize or scale the host at runtime, the written mesh points already follow the current bounding box automatically. Use `Set Mesh Columns` or `Set Mesh Rows` only when you want a different simulation density, not just because the object changed size.

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
| **Auto Physics Force** | Check | `true` | When checked, Physics-behavior objects that overlap the water object automatically cause a splash. In the event sheet, the matching action is labeled **Set physics auto-splash enabled**. While enabled, idle shutdown is bypassed so the collision scan can keep running. |
| **Physics Force Multiplier** | Float | `0.05` | Base automatic splash strength. It scales the impacting object's vertical velocity when no object-type or one-instance override is set. |
| **Physics Surface Radius** | Integer | `20` | Base automatic splash width in pixels when no object-type or one-instance override is set. |
| **Idle Threshold** | Float | `0.01` | Maximum column speed (px/tick) at which the simulation is considered at rest. `0` disables idle detection entirely. |
| **Spread Pass Count** | Integer | `7` | Spread iterations per tick. More passes = disturbances travel farther per frame. Clamped 1–16. |
| **Enabled** | Check | `true` | Whether the water behavior is active. When disabled, the simulation is paused and ticking stops. |
| **Max Wave Height** | Float | `0` | Caps how far the surface may displace from rest, in pixels, in **both** directions (peak height and trough depth). Prevents extreme spikes from large splash forces. `0` disables the cap. If using auto-waves, set this to `0` or at least the wave **Magnitude** to avoid clipping the waves flat. |

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

### Capping surface displacement (Max Wave Height)

A single large impulse — a heavy Physics object hitting fast, or a big manual `ApplyForce` — can drive one column far past the rest of the surface, producing a tall, narrow spike that shoots above the water body. The **Max Wave Height** property (and the matching **Set max wave height** action) caps how far any column may move from rest, in **both** directions (peak height above the surface and trough depth below it). When a column reaches the cap, the extra velocity still pushing it further is discarded, so energy does not keep building against the limit and ring.

`0` disables the cap (the default). Any positive value is the maximum displacement in pixels.

**Set a cap in the editor, or once at start of layout:**

```
Event: Start of layout
  Action: Water → Set max wave height -> 40
  // No column can rise more than 40px above (or sink 40px below) the rest surface,
  // even on a hard splash. Splashes stay lively but never spike off the top.
```

**Loosen or tighten the cap by context:**

```
Event: Boss slams into the pool
  Action: Water → Set max wave height -> 120
  // Allow a dramatic, tall splash for this one big moment.

Event: Boss fight ends
  Action: Water → Set max wave height -> 40
  // Back to a controlled surface. Lowering the cap trims any current spike immediately.
```

**Combining it with Physics auto-splash** (the common case for the spike problem):

```
Event: Start of layout
  Action: Water → Set physics auto-splash enabled -> true
  Action: Water → Set default splash setting -> Force multiplier, 0.5
  Action: Water → Set max wave height -> 50
  // Heavy, fast objects still splash, but the cap stops a fast impact from launching
  // a single column far above the surface.
```

> **Auto-waves:** the cap clamps *total* displacement from rest, including auto-wave motion. If you use auto-waves, set Max Wave Height to `0` (disabled) or to at least your wave **Magnitude**, otherwise the wave peaks get clipped flat.

> **Reading the cap:** the `MaxWaveHeight` expression returns the current cap in pixels (`0` when disabled).

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

## 6. Physics Splash Settings

The **Physics Splash Settings** category covers the automatic Physics splash system. It watches all Physics-behavior objects in the layout. When one overlaps the water object, the behavior automatically computes a splash force from the object's vertical velocity and calls `ApplyForce` internally. In the event sheet, the numeric splash setters are grouped behind a **Setting** parameter with the choices **Force multiplier** and **Surface radius**, plus a separate **Set physics auto-splash enabled** toggle action.

### Collision check

An object is considered to have entered the water when its bounding box overlaps the water object's bounds on the current tick but did not overlap them on the previous tick.

### Force calculation

```
force = physics.velocityY × physicsForceMultiplier
```

A typical falling rock might have `velocityY ≈ 300 px/s`. With `physicsForceMultiplier = 0.5` the force applied is `150`. In practice, the multiplier used here is the currently resolved value after applying the order **UID override → object-type value → water default**. Tune the value until splashes feel proportional to the object's visual weight.

### Three levels of splash settings

Physics splash settings can be configured at three levels:

1. **Water default** — applies to everything unless something more specific overrides it.
2. **Object type default** — applies to all instances of one object type.
3. **One instance override** — applies to one exact UID.

The runtime always resolves them in this order:

```
one instance override → object type default → water default
```

This means you can set a general rule for all crates, then override one special crate without affecting the rest.

### Enabling and listening to impacts

```
Event: Start of layout
  Action: Water → Set physics auto-splash enabled -> true
  Action: Water → Set default splash setting -> Force multiplier, 0.5
  Action: Water → Set default splash setting -> Surface radius, 30

Event: Water → On Physics impact (UID filter: 0)
  // Fires once per object per new overlap with the water.
  // UID filter 0 = any object.
  Action: SplashParticles → Spawn at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
  Action: DebugText → Set text -> "Impact! Force=" & Water.ImpactForce
```

### Setting values for one object type

Use the object-type actions when every instance of the same object class should use the same Physics splash settings.

```
Event: Start of layout
  Action: Water → Set object-type splash setting -> Rock, Force multiplier, 1.2
  Action: Water → Set object-type splash setting -> Rock, Surface radius, 42
  // All Rock instances now use a larger force multiplier and surface radius than the water default.

Event: Heavy rock mode ends
  Action: Water → Clear object-type splash setting -> Rock, Force multiplier
  Action: Water → Clear object-type splash setting -> Rock, Surface radius
  // Rock goes back to the water default values.
```

In the event sheet, these ACEs use an object picker, so you select the object type directly. In script, string names are still accepted and matched case-insensitively.

### Setting values for one specific instance

Use the UID actions when only one exact object should behave differently.

```
Event: Boss crate is created
  Action: Water → Set instance splash setting -> BossCrate.UID, Force multiplier, 2.0
  Action: Water → Set instance splash setting -> BossCrate.UID, Surface radius, 60
  // This exact crate gets custom Physics splash settings without affecting other crates.

Event: Boss crate is defeated
  Action: Water → Clear instance splash setting -> BossCrate.UID, Force multiplier
  Action: Water → Clear instance splash setting -> BossCrate.UID, Surface radius
  // The crate falls back to its object-type or water default values.
```

If the instance is destroyed, its UID override is cleaned up automatically the next time the behavior prunes dead instance entries.

### Filtering by specific object

Pass the object's UID to `OnPhysicsImpact` to react only to a particular instance:

```
Event: Water → On Physics impact (UID filter: Rock.UID)
  Action: RockSplashEffect → Spawn
```

### What counts as a Physics object

The behavior scans **every object type** in the layout on each tick (when auto-splash is enabled) and checks whether the instance has a **Physics behavior** attached. Objects without a Physics behavior are skipped immediately. Instances that do have a Physics behavior reuse a cached behavior lookup by UID on later scans.

> **Important:** The scan covers all object types in the layout. For best performance, keep Auto Physics Force disabled when the water is off-screen or when no Physics objects are present.

> **Important:** The Properties Bar still uses the full names **Physics Force Multiplier** and **Physics Surface Radius**. In the event sheet, you change those through **Set default splash setting**, **Set object-type splash setting**, or **Set instance splash setting**, then choose **Force multiplier** or **Surface radius** in the **Setting** parameter.

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

When the surface settles, the behavior automatically stops ticking only while **auto-waves** and **auto-splash** are both disabled. Any manual force wakes it again. Enabling either auto-waves or auto-splash keeps the behavior ticking continuously.

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

### Fixed-step simulation controls

The water simulation now runs on a fixed timestep with configurable catch-up limits. This keeps wave behavior consistent across variable frame rates while still allowing you to tune how aggressively the behavior catches up after frame hitches.

Use these two actions together:

- **Set fixed simulation step** controls simulation granularity in seconds (clamped to `1/240..1/15`).
- **Set max simulation steps per tick** controls catch-up budget per frame (clamped to `1..20`).

```
Event: Start of layout
  Action: Water → Set fixed simulation step -> 0.0166667
  Action: Water → Set max simulation steps per tick -> 8
  // 60 Hz simulation with extra hitch recovery headroom.
```

> Tip: Lower fixed steps (e.g. 1/120) improve temporal precision but increase CPU cost. Higher max-steps values improve hitch recovery but can create heavier individual frames.

### Off-screen optimization pattern

For off-screen water, the biggest win is to disable every continuous system and force the surface to rest immediately. This removes both simulation work and Physics overlap scan work while the water is hidden.

If you still want ambient motion while off-screen, use **Set off-screen auto-wave lightweight mode**. In that mode the behavior only advances wave phase and rebuilds the surface directly, skipping spring and spread simulation.

Trade-offs of phase-only mode:

- Hidden ripple momentum does not continue simulating while the mode is active.
- Manual `ApplyForce` dynamics are effectively bypassed while in phase-only mode.
- Best used only while the water is off-screen.

Use a small hysteresis gap so the behavior does not rapidly toggle on/off near the viewport edge.

```
Event: Every 0.2 seconds
  Condition: Water is outside viewport + 200px margin
  Action: Water → Set off-screen auto-wave lightweight mode -> true
  Action: Water → Set physics auto-splash enabled -> false
  Action: Water → Set spread pass count -> 2
  Action: Water → Set fixed simulation step -> 0.0333333
  Action: Water → Set max simulation steps per tick -> 2
  // Keep auto-waves on if you want ambient continuity while hidden.

Event: Every 0.2 seconds
  Condition: Water is inside viewport + 100px margin
  Action: Water → Set off-screen auto-wave lightweight mode -> false
  Action: Water → Set spread pass count -> 7
  Action: Water → Set fixed simulation step -> 0.0166667
  Action: Water → Set max simulation steps per tick -> 8
  Action: Water → Set physics auto-splash enabled -> true
  // Only re-enable auto-waves if this water body should be ambient.
```

> Tip: If your project has many water instances, stagger checks (for example by UID modulo) so visibility logic itself does not spike one frame.

### Performance profiles

These presets are practical starting points. Apply them by state (near camera, far camera, hidden), not every tick.

| Profile | Target use | Mesh Columns | Spread Pass Count | Fixed Sim Step | Max Sim Steps/Tick | Auto-Waves | Auto-Splash |
|---|---|---:|---:|---:|---:|---|---|
| **Cinematic** | Foreground, gameplay-critical water | 64–128 | 8–12 | `1/60` | 8–12 | Optional | On |
| **Balanced** | Typical visible gameplay water | 32–64 | 4–8 | `1/60` | 4–8 | Optional | On near player |
| **Low-End / Off-Screen** | Background or hidden water | 8–32 visible, keep current when hidden | 1–3 | `1/30` | 1–3 | Off | Off |

When switching to hidden state, always pair profile changes with `Flatten Surface -> 100` so the sim can sleep immediately.

---

## 9. Actions Reference

### Simulation Control

| Action | Description |
|---|---|
| **Set enabled** `(enabled)` | Enables or disables the water behavior. When disabled, the simulation is paused and ticking stops. Scriptable: `water.enabled = true/false` or `water.SetEnabled(true/false)`. |
| **Flatten Surface** `(percentage)` | Instantly removes part of the current disturbance. `50` halves the current wave height and velocity; `100` fully resets all columns to the flat rest height and clears their velocity. |
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
| **Set max wave height** `(maxWaveHeight)` | Caps surface displacement from rest, in pixels, in both directions. `0` disables the cap. Lowering the cap trims any current spike immediately. Prevents extreme spikes from large splash forces. |

### Physics Splash Settings

| Action | Description |
|---|---|
| **Apply splash force** `(x, force, radius)` | Pushes the surface up or down at a world X position. Does not require any object with a Physics behavior, use this to trigger splashes manually from events or script. Negative force = push down (which bounces back up). Radius controls how many pixels wide the splash is. |
| **Set physics auto-splash enabled** `(enabled)` | Turns automatic Physics splash detection on or off. When enabled, objects with the Physics behavior that enter the water create splashes automatically. Turning it off clears tracked overlaps immediately. |
| **Set default splash setting** `(setting, value)` | Sets either the base Physics force multiplier or the base Physics surface radius used when no object-type or instance override exists. Applies to all Physics-behavior objects in the water. |
| **Set object-type splash setting** `(objectType, setting, value)` | Sets either the force multiplier or surface radius for every instance of one picked object type. Instances of that type must have the Physics behavior attached to be affected. |
| **Clear object-type splash setting** `(objectType, setting)` | Clears the selected object-type splash setting so it falls back to the water default. |
| **Set instance splash setting** `(uid, setting, value)` | Sets either the force multiplier or surface radius for one exact instance UID. The instance must have the Physics behavior attached. This overrides both object-type and water defaults. |
| **Clear instance splash setting** `(uid, setting)` | Clears the selected instance splash setting so it falls back to the object-type or water default. |

### Performance

| Action | Description |
|---|---|
| **Set Idle Threshold** `(value)` | Changes the minimum column speed for idle detection. `0` disables it. |
| **Set Spread Pass Count** `(count)` | Changes lateral spread iterations per tick. Clamped to 1–16. |
| **Set fixed simulation step** `(seconds)` | Sets fixed simulation step size in seconds. Clamped to `1/240..1/15`. Lower values increase precision and CPU usage. |
| **Set max simulation steps per tick** `(steps)` | Sets maximum fixed simulation catch-up steps per frame. Clamped to `1..20`. Higher values recover from hitches better but can increase per-frame cost. |
| **Set off-screen auto-wave lightweight mode** `(enabled)` | Performance saver for off-screen auto-wave water. When enabled, only wave phase is advanced and the surface is reconstructed directly. Trade-off: hidden ripple momentum and manual force dynamics are not simulated while active. |

---

## 10. Conditions Reference

| Condition | Description |
|---|---|
| **Behavior is enabled** | True when the water behavior is currently enabled. Invertible. |
| **Auto-waves is enabled** | True when auto-wave oscillation is currently active. Invertible. |
| **Physics auto-force is enabled** | True when Physics splash detection is currently active. Invertible. |
| **Simulation is idle** | True when the simulation has stopped ticking because all columns settled below the idle threshold. Invertible. |

---

## 11. Expressions Reference

| Expression | Returns | Description |
|---|---|---|
| `SurfaceY(x)` | Number | World Y of the water surface at world X coordinate `x`. Returns `bbox.top` if `x` is outside the object's horizontal bounds. |
| `SurfaceNormal(x)` | Number | Upward surface normal angle in radians at world X coordinate `x`. `x` is clamped to the water bounds. |
| `SurfaceNormalAngle(x)` | Number | Upward surface normal angle in degrees from `0` to `360` at world X coordinate `x`. `x` is clamped to the water bounds. |
| `MeshColumns` | Number | Current number of simulation columns. |
| `MeshRows` | Number | Current number of mesh rows. |
| `AutoWaveEnabled` | Number | `1` if auto-waves are active, `0` if not. |
| `MaxWaveHeight` | Number | Current max wave height cap in pixels (displacement from rest, either direction). `0` means the cap is disabled. |
| `FixedSimStep` | Number | Current fixed simulation step size in seconds. |
| `MaxSimStepsPerTick` | Number | Current maximum fixed simulation catch-up steps per tick. |
| `ObjectTypeSplashValue(objectType, setting)` | Number | Returns the effective splash setting value for the given object type, applying any object-type override then falling back to the water default. Does not require the Physics behavior to query. `setting` should be `"force_multiplier"` or `"surface_radius"`. |
| `InstanceSplashValue(uid, setting)` | Number | Returns the effective splash setting value for the given UID after applying the full override order: UID override → object-type override → water default. Does not require the Physics behavior to query. `setting` should be `"force_multiplier"` or `"surface_radius"`. |

---

## 12. Triggers Reference

| Trigger | Description |
|---|---|
| **On Physics impact** `(instanceUID)` | Fires once per Physics instance per water-overlap entry. Pass `0` as the UID filter to receive impacts from any object. Pass a specific UID to filter for one instance. |

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

> Tip: Auto-waves bypass idle detection, and auto-splash does too. Disable both when the water should eventually go still.

---

### Physics Splash Settings system

This system uses the Physics Splash Settings category ACEs to watch Physics-behavior objects and convert their vertical entry velocity into a splash impulse automatically.

**Scenario A — Splash particle on any Physics impact**

```
Event: Water → On Physics impact (UID filter: 0)
  Action: Splash → Create object at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
  Action: Splash → Set angle -> -90  // upward burst
```

**Scenario B — Change the water-wide default splash rule**

```
Event: Start of layout
  Action: Water → Set physics auto-splash enabled -> true
  Action: Water → Set default splash setting -> Force multiplier, 0.4
  Action: Water → Set default splash setting -> Surface radius, 35
  // Everything uses this rule unless an object type or one-instance rule overrides it.
```

**Scenario C — Make one object type splash harder**

```
Event: Start of layout
  Action: Water → Set object-type splash setting -> Boulder, Force multiplier, 1.4
  Action: Water → Set object-type splash setting -> Boulder, Surface radius, 50
  // Every Boulder instance now creates a bigger splash than the default rule.
```

**Scenario D — Different effect for heavy vs. light impacts**

```
Event: Water → On Physics impact (UID filter: 0)
  Condition: Water.ImpactForce > 100
    Action: BigSplash → Spawn at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
  Condition: Water.ImpactForce <= 100
    Action: SmallSplash → Spawn at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
```

**Scenario E — Disable auto-splash when the level is paused**

```
Event: Game paused
  Action: Water → Set physics auto-splash enabled -> false

Event: Game unpaused
  Action: Water → Set physics auto-splash enabled -> true
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

**Scenario C — Soft buoyancy for a floating crate**

```
Event: Every tick
  Local variable: surfY = Water.SurfaceY(Crate.X)
  Local variable: targetY = surfY - Crate.Height * 0.45
  Action: Crate → Set Y -> Crate.Y + (targetY - Crate.Y) * 0.12
  // Moves the crate partway toward the surface each tick for a soft floating motion.
```

> Tip: This is a simple non-Physics buoyancy trick. It is ideal for pickups, debris, and decorative objects that only need to look like they float.

**Scenario D — Stronger lift the deeper an object sinks**

```
Event: Every tick
  Local variable: surfY = Water.SurfaceY(Barrel.X)
  Local variable: depth = (Barrel.Y + Barrel.Height * 0.5) - surfY
  Condition: depth > 0
  Action: Barrel → Set Y -> Barrel.Y - min(depth * 0.15, 4)
  // The deeper the barrel sinks below the surface, the more it gets pushed back up.
```

> Tip: Combine this with `ApplyForce` when the object first lands in the water so the entry splash and the later floating behaviour feel connected.

---

### Idle Detection system

Idle detection automatically halts the simulation when the surface has settled and no continuous system is keeping the behavior awake, saving CPU on calm water.

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
Event: Start of layout
  Action: Water → Set max wave height -> 24
  // A shallow puddle: even a long dash-jump landing can't spike higher than 24px.

Event: Player → On landed (Platform behavior)
  Condition: Player → Is overlapping Water
  Action: Water → Apply Force -> Player.X, -80, Player.Width / 2
  Action: SplashParticles → Spawn at -> Player.X, Water.SurfaceY(Player.X)
```

> `Player.Width / 2` as the radius means the splash covers roughly the player's footprint.

> **Cap the splash to the puddle depth.** A fast fall (a long drop or a dash-jump) can shoot a thin spike out of a shallow puddle. Setting **Max Wave Height** to roughly the puddle's visible depth keeps even a hard landing contained, so the splash always reads as "in the puddle".

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

> In the Properties Bar these values are still called **Physics Force Multiplier** and **Physics Surface Radius**. In the event sheet, change them with **Set default splash setting** and choose **Force multiplier** or **Surface radius** in the **Setting** parameter.

---

### Use Case 3B — Rocks splash harder than coins, but one special coin splashes big

**Scenario:** A platformer has heavy rocks, light coins, and one magic coin that should create a large splash despite being small.

```
Event: Start of layout
  Action: Water → Set default splash setting -> Force multiplier, 0.25
  Action: Water → Set default splash setting -> Surface radius, 20
  Action: Water → Set object-type splash setting -> Rock, Force multiplier, 1.1
  Action: Water → Set object-type splash setting -> Rock, Surface radius, 44
  Action: Water → Set instance splash setting -> MagicCoin.UID, Force multiplier, 0.9
  Action: Water → Set instance splash setting -> MagicCoin.UID, Surface radius, 36
  // Most coins use the default rule, rocks use the rock rule, and MagicCoin uses its own UID rule.
```

> The UID rule wins over the object-type rule, so MagicCoin still uses its own settings even if it belongs to an object type with a different splash rule.

---

### Use Case 4 — Surface-following boat

**Scenario:** A small boat sprite should bob along the water surface, its Y position tracking the live wave height.

```
Event: Every tick
  Local variable: surfY = Water.SurfaceY(Boat.X)
  Action: Boat → Set Y -> surfY - Boat.Height * 0.6
  Action: Boat → Set angle -> Water.SurfaceNormalAngle(Boat.X) + 90
  // SurfaceNormalAngle returns the upward normal in degrees; add 90 to align to the surface tangent.
```

---

### Use Case 4B — Foam emitter aligned to the wave normal

**Scenario:** A foam or spray emitter should point away from the water surface instead of always facing straight up.

```
Event: Every tick
  Local variable: surfY = Water.SurfaceY(Foam.X)
  Action: Foam → Set position -> Foam.X, surfY
  Action: Foam → Set angle -> Water.SurfaceNormalAngle(Foam.X)
  // The emitter points along the upward surface normal, so spray follows the wave face.
```

---

### Use Case 4C — Floating pickup with simple buoyancy

**Scenario:** A collectible chest or floating pickup should settle on the water surface and bob gently instead of sinking straight through.

```
Event: Pickup → Is overlapping Water
  Local variable: surfY = Water.SurfaceY(Pickup.X)
  Local variable: targetY = surfY - Pickup.Height * 0.4
  Action: Pickup → Set Y -> Pickup.Y + (targetY - Pickup.Y) * 0.1
  Action: Pickup → Set angle -> Water.SurfaceNormalAngle(Pickup.X) + 90
  // Position follows the surface slowly, so the object feels buoyant instead of glued in place.
```

> Use a smaller follow factor like `0.05` for heavy objects and a larger factor like `0.2` for light, floaty objects.

---

### Use Case 4D — Two-point buoyancy for a raft or plank

**Scenario:** A raft should not only float up and down, but also tilt correctly when one side of the wave is higher than the other.

```
Event: Every tick
  Local variable: leftX = Raft.X - Raft.Width * 0.35
  Local variable: rightX = Raft.X + Raft.Width * 0.35
  Local variable: leftY = Water.SurfaceY(leftX)
  Local variable: rightY = Water.SurfaceY(rightX)
  Action: Raft → Set Y -> ((leftY + rightY) * 0.5) - Raft.Height * 0.5
  Action: Raft → Set angle -> angle(leftX, leftY, rightX, rightY)
  // Sampling two points makes the raft follow both the average height and the local slope of the water.
```

> This usually looks better than sampling only the centre point, especially on long floating objects like logs, rafts, and bridges.

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
  Action: Lava → Set max wave height -> 18
  // Slow, thick, barely-propagating surface that bulges rather than splashes —
  // the cap stops a heavy rock from throwing a thin spike of lava into the air.

Event: Rock falls into Lava → On Physics impact (UID filter: 0)
  Action: Lava → Set default splash setting -> Force multiplier, 2.0
  // Heavy impacts make bigger impressions despite the low tension.
```

> A low **Max Wave Height** reinforces the "heavy fluid" feel: even with a strong force multiplier the surface rises only a little, so impacts read as dense lava absorbing the blow rather than light water flicking upward.

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
  Action: Water → Set physics auto-splash enabled -> false
  Action: Water → Set auto-waves enabled -> false
  Action: Water → Set idle threshold -> 999
  // With both continuous systems off, the next idle check snaps the surface to rest.

Event: Water enters screen
  Action: Water → Set idle threshold -> 0.01
  Action: Water → Set physics auto-splash enabled -> true
  // Restore normal idle threshold and re-enable automatic Physics splashes.
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
  Action: Water → Flatten Surface -> 100
  Action: Water → Set auto-waves enabled -> false
  // Instant reset to a flat, motionless surface.

Event: Level restart (ambient waves desired)
  Action: Water → Flatten Surface -> 100
  Action: Water → Set auto-waves enabled -> true
  // Flattening clears the current disturbance, then auto-waves resume on the next tick.
```

> `Flatten Surface -> 100` is the direct reset action. If auto-waves stay enabled, the surface will start oscillating again on the next tick because the ambient wave target is still active.

### Use Case 14B — Softening a rough surface without fully resetting it

**Scenario:** A cutscene starts and the water should calm down quickly, but not snap completely flat.

```
Event: Cutscene begins
  Action: Water → Flatten Surface -> 60
  // Removes most of the current disturbance while preserving some motion.

Event: Dialogue line advances
  Action: Water → Flatten Surface -> 30
  // Reapply a partial flatten if you want the pool to keep calming down in steps.
```

> `Flatten Surface` scales both displacement and velocity toward zero based on the percentage you pass. It is a one-shot reduction, not a timed easing action.

---

### Use Case 15 — Physics drop puzzle with a capped splash ceiling

**Scenario:** A puzzle game drops crates, balls, and weights into a pool. Heavy or fast objects look great, but the fastest impacts launch a single column into a tall, thin spike that shoots far above the water — breaking the illusion. **Max Wave Height** puts a ceiling on that overshoot while keeping splashes responsive.

```
// Properties set in the editor:
// Auto Physics Force: checked
// Physics Force Multiplier: 0.5
// Physics Surface Radius: 35
// Max Wave Height: 50   ← no splash can rise above / sink below 50px from rest

Event: Water → On Physics impact (UID filter: 0)
  Action: SplashEffect → Create at -> Water.ImpactX, Water.SurfaceY(Water.ImpactX)
  Action: SplashSound → Play
```

If one special object should still be allowed a big dramatic splash, raise the cap just for that impact and lower it again afterward:

```
Event: Water → On Physics impact (UID filter: Boulder.UID)
  Action: Water → Set max wave height -> 140
  Action: System → Wait 0.3 seconds
  Action: Water → Set max wave height -> 50
  // The boulder gets a tall splash; everything else stays capped.
```

> **Tuning:** drop your heaviest / fastest object, then lower Max Wave Height until the spike stops poking out of the surface. A value near the host object's height is usually a safe ceiling. Because the cap also discards the velocity pushing past it, capped impacts settle faster instead of ringing against the limit.

---

### Use Case 16 — Aquarium that never spills over its rim

**Scenario:** Water sits inside a glass tank. When the player shakes the tank or drops a fish in, the surface should slosh — but it must never rise above the rim of the glass, or the water visibly pokes through the frame. **Max Wave Height** ties the wave ceiling to the gap between the resting surface and the rim.

```
Event: Start of layout
  // TankRim is the top inner edge of the glass; the water's resting surface sits at Water.SurfaceY(Water.X).
  Local variable: headroom = Water.SurfaceY(Water.X) - TankRim.Y
  Action: Water → Set max wave height -> max(headroom - 4, 0)
  // Leave a 4px safety margin so a peak never touches the glass.

Event: Player shakes the tank
  Action: Water → Apply splash force -> Water.X, -120, Water.Width * 0.5
  // A strong slosh — but the cap keeps the peak just below the rim.
```

If the tank is resized or the water level changes, recompute the headroom on that change (not every tick):

```
Event: Water level changed
  Local variable: headroom = Water.SurfaceY(Water.X) - TankRim.Y
  Action: Water → Set max wave height -> max(headroom - 4, 0)
```

> Because the cap clamps displacement in *both* directions, the same setting also stops the trough from dipping so far on a hard slosh that it reveals the empty tank floor.

---

### Other game use cases

**Puzzle platformers.** Water bodies as interactive hazards — precise `SurfaceY` queries let the game code know exactly when a character is submerged vs. standing on the surface. Combine Physics auto-splash with the trigger's `ImpactForce` to scale damage or sound effects by entry velocity.

**Metroidvania / exploration games.** Multiple named water bodies throughout the map, each with different physics parameters. With auto-splash disabled on decorative pools, idle detection lets off-screen bodies sleep for free. Bring them back to life with a single `ApplyForce` call when the player re-enters the area.

**Tower defence.** A moat that projectiles must cross. Projectiles with the Physics behavior create automatic visual ripples as they overlap the water, adding battlefield atmosphere with zero extra event sheet code.

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
| **2DWater — Simulation** | Enabled flag (editable toggle), Mesh Columns, Mesh Rows, Is Idle flag, Spread Pass Count (editable), Max Wave Height (editable). |
| **2DWater — Auto-Wave** | Enabled flag (toggle), Wave Length, Period, Magnitude. All editable. Toggling Enabled calls `SetAutoWavesEnabled` with side-effects. |
| **2DWater — Physics Force** | Auto Physics Force flag, Force Multiplier, Physics Surface Radius, Object Type Defaults count, Instance Overrides count, Tracked Count. |
| **2DWater — Performance** | Idle Threshold, Fixed Sim Step (s), Max Sim Steps/Tick. All editable. |

### Full field reference

| Field | Editable | Description |
|---|---|---|
| Tension | ✅ | Live spring stiffness |
| Dampening | ✅ | Live energy decay |
| Spread | ✅ | Live lateral propagation |
| Enabled (behavior) | ✅ | Toggles whether the water behavior is active |
| Mesh Columns | ❌ | Column count (change via action) |
| Mesh Rows | ❌ | Row count (change via action) |
| Is Idle | ❌ | `true` when ticking is halted |
| Spread Pass Count | ✅ | Iterations per tick |
| Max Wave Height | ✅ | Surface displacement cap in px (either direction); `0` disables it |
| Enabled (auto-wave) | ✅ | Toggles auto-waves live |
| Wave Length | ✅ | Spatial wavelength |
| Period | ✅ | Cycle duration (s) |
| Magnitude | ✅ | Peak amplitude (px) |
| Auto Physics Force | ❌ | Whether Physics scan is running |
| Force Multiplier | ✅ | Velocity-to-force scale |
| Physics Surface Radius | ✅ | Auto-impact splash radius |
| Object Type Defaults | ❌ | How many object types currently have custom splash settings |
| Instance Overrides | ❌ | How many exact instance UIDs currently have custom splash settings |
| Tracked Count | ❌ | Objects currently in the water |
| Idle Threshold | ✅ | Idle speed threshold |
| Fixed Sim Step (s) | ✅ | Fixed simulation step size in seconds (clamped to `1/240..1/15`) |
| Max Sim Steps/Tick | ✅ | Maximum fixed simulation catch-up steps each tick (clamped to `1..20`) |
| Off-screen Auto-Wave Lightweight | ✅ | Enables lightweight off-screen auto-wave mode. Trade-off: hidden ripple momentum and force dynamics are skipped while active. |

> All editable fields take effect immediately — the change is visible in the running layout without stopping the project.

---

## 16. Scripting (C3 Script / JavaScript)

### Accessing the behavior

The behavior name in script is derived from the **object's behavior name in the project** (the name shown in the Behaviors panel), not the addon ID. By default it is `2DWater`. Because only one 2DWater behavior can be attached to any given object, there is always exactly one entry to access.

```js
const water = waterObj.behaviors["2DWater"];
```

If the behavior has been renamed to "River" in the Behaviors panel (e.g. to `"River"`), use that name instead:

```js
const water = waterObj.behaviors.River;
```

### Calling actions from script

All actions with `expose: true` are copied directly onto the behavior's runtime prototype. The method name is PascalCase and matches the filename of the ACE (`a.ApplyForce.js` → `ApplyForce()`).

```js
// Enable/disable the behavior
water.enabled = true;   // Enable (can also use water.SetEnabled(true))
water.enabled = false;  // Disable (pauses simulation)

// Apply a splash
water.ApplyForce(playerInst.x, -80, 30);
water.FlattenSurface();
water.FlattenSurface(50);

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
water.SetMaxWaveHeight(40); // cap displacement at ±40px; pass 0 to disable

// Physics auto-splash
water.SetPhysicsAutoSplashEnabled(true);
water.SetDefaultSplashSetting("force_multiplier", 0.5);
water.SetDefaultSplashSetting("surface_radius", 25);
water.SetObjectTypeSplashSetting("Rock", "force_multiplier", 1.2);
water.SetObjectTypeSplashSetting("Rock", "surface_radius", 40);
water.SetInstanceSplashSetting(bossRock.uid, "force_multiplier", 2.0);
water.SetInstanceSplashSetting(bossRock.uid, "surface_radius", 56);

// Performance
water.SetIdleThreshold(0.01);
water.SetSpreadPassCount(7);
water.SetFixedSimStep(1 / 60);
water.SetMaxSimStepsPerTick(8);
water.SetOffscreenAutoWaveLightweightModeEnabled(true); // enables off-screen auto-wave lightweight mode
```

All parameters are passed in the same order as the ACE's `params` array. The splash setting action ACEs use a `Setting` combo in the event sheet: in script you can pass either the combo index (`0` = force multiplier, `1` = surface radius) or a string such as `"force_multiplier"` or `"surface_radius"`. The splash value expressions use the same string keys for their `setting` argument.

> In script, the method names still come from the ACE filenames. Object-type methods can still take string names like `"Rock"` even though the event sheet uses an object picker.

### Reading state from script

Expressions are now exposed to script too, so the same query logic used in the event sheet is also available as PascalCase methods on the behavior instance.

```js
// Surface query expressions
const surfY = water.SurfaceY(playerInst.x);
const normalRadians = water.SurfaceNormal(playerInst.x);
const normalDegrees = water.SurfaceNormalAngle(playerInst.x);

// Behavior state
const isEnabled = water.enabled;  // Read enabled state

// Mesh and simulation state
const cols = water.MeshColumns();
const rows = water.MeshRows();
const autoWavesOn = water.AutoWaveEnabled();   // 1 or 0
const maxWaveHeight = water.MaxWaveHeight();   // px cap, 0 = disabled
const fixedStep = water.FixedSimStep();
const maxCatchupSteps = water.MaxSimStepsPerTick();

// Auto-splash settings
const rockStrength = water.ObjectTypeSplashValue("Rock", "force_multiplier");
const rockWidth = water.ObjectTypeSplashValue("Rock", "surface_radius");
const bossStrength = water.InstanceSplashValue(bossRock.uid, "force_multiplier");
const bossWidth = water.InstanceSplashValue(bossRock.uid, "surface_radius");

// Impact context expressions
// Valid during or after an impact, and most useful inside OnPhysicsImpact listeners.
const impactX = water.ImpactX();
const impactForce = water.ImpactForce();
const impactUid = water.ImpactUID();
```

> Exposed expression methods run the same logic as the event-sheet expressions. This is the stable way to query water state from script; you no longer need to read private `_` fields for normal use.

### Listening to triggers from script

```js
water.addEventListener("OnPhysicsImpact", (e) => {
  // Impact context expressions are script-callable too
  const x     = water.ImpactX();
  const force = water.ImpactForce();
  const uid   = water.ImpactUID();
  console.log(`Impact at x=${x}, force=${force}, uid=${uid}`);
});
```

> The `0` UID-filter parameter in the event sheet is the condition's filter argument, not available as an event property. All `OnPhysicsImpact` script listeners fire for every impact regardless of UID — filter manually if needed.

### Complete example

```js
// Called from a script event each tick for a floating boat object
function updateBoatOnWater(water, boat) {
  const surfY = water.SurfaceY(boat.x);
  boat.y = surfY - boat.height * 0.6;
  boat.angleDegrees = water.SurfaceNormalAngle(boat.x) + 90;
}

function setupOcean(runtime) {
  const [waterObj] = runtime.objects.Ocean.getAllInstances();
  const [boat] = runtime.objects.Boat.getAllInstances();
  const [bossRock] = runtime.objects.BossRock.getAllInstances();
  const water = waterObj.behaviors["2DWater"];

  water.enabled = true;  // Make sure water is active
  water.SetAutoWavesEnabled(true);
  water.SetMagnitude(3);
  water.SetPeriod(2.5);
  water.SetWaveLength(350);
  water.SetPhysicsAutoSplashEnabled(true);
  water.SetDefaultSplashSetting("force_multiplier", 0.4);
  water.SetDefaultSplashSetting("surface_radius", 30);
  water.SetFixedSimStep(1 / 60);
  water.SetMaxSimStepsPerTick(8);
  water.SetObjectTypeSplashSetting("Rock", "force_multiplier", 1.1);
  water.SetObjectTypeSplashSetting("Rock", "surface_radius", 42);
  water.SetInstanceSplashSetting(bossRock.uid, "force_multiplier", 1.8);
  water.SetInstanceSplashSetting(bossRock.uid, "surface_radius", 60);

  water.addEventListener("OnPhysicsImpact", () => {
    const splashX = water.ImpactX();
    spawnSplashEffect(runtime, splashX, water.SurfaceY(splashX));
  });

  updateBoatOnWater(water, boat);
}
```

---

## 17. Tips and Common Mistakes

- **Do not call `SetMeshColumns` or `SetMeshRows` every tick.** These actions rebuild the entire mesh, which is expensive. Call them once on a state change (level start, area transition, etc.).

- **`ImpactX`, `ImpactForce`, and `ImpactUID` are only valid inside `On Physics impact`.** Reading them outside the trigger handler returns the values from the most recent impact, which may be stale by many frames.

- **Positive force pushes up; negative pushes down.** A stone dropping into water should use a negative force (the surface dips, then bounces back). A bubble surfacing from below would use a positive force.

- **`Flatten Surface` takes a percentage.** `100` is a full reset, but smaller values reduce momentum too. `50` does not just halve the visible height; it also halves the stored column velocity, so the remaining motion is calmer as well as smaller.

- **Auto-waves and physics auto-splash both bypass idle detection.** If you want the water to settle completely, set `Set auto-waves enabled → false` and `Set physics auto-splash enabled → false` first. The idle threshold alone will not stop a ticking simulation while either continuous system is active.

- **Do not push fixed-step settings to extremes without profiling.** Smaller fixed steps (for example `1/240`) increase precision but cost more CPU. Very high max catch-up steps can recover hitches better, but may create heavier single frames.

- **Use off-screen auto-wave lightweight mode only while hidden.** It is a high-gain performance saver for ambient off-screen water, but hidden ripple momentum and manual force dynamics are skipped while active.

- **Physics splash settings use a strict priority order.** One instance override wins over the object type setting, and the object type setting wins over the water default. If a splash looks wrong, check the instance splash setting first.

- **Object-type rules use picked object types in the event sheet; instance rules use UIDs.** `Set object-type splash setting` lets you pick an object directly in the event sheet, then choose **Force multiplier** or **Surface radius** in the **Setting** parameter. In script, you can still pass a string like `"Rock"`. `Set instance splash setting` still expects a numeric UID like `Rock.UID`.

- **`Spread` above 0.5 can cause instability.** Values in the range 0.4–0.5 are already aggressive. Values above 0.5 may cause the simulation to produce growing oscillations rather than decaying ones. If you see the water "exploding", reduce Spread first.

- **Auto Physics overlap uses the object's current bounds.** If you move or scale the water object at runtime, the overlap test follows automatically because it reads `getBoundingBox()` each tick.

- **For very narrow water objects (< 100px wide), use fewer columns.** 64 columns on a 60px puddle means columns are less than 1px apart, which wastes computation and can produce aliasing artifacts in the wave shape. Drop to 8–16 for narrow objects.

- **The mesh must have at least 2 rows.** Construct's mesh system does not support 1-row meshes. Requesting `SetMeshRows(1)` will silently clamp to 2.

- **Save/load is automatic.** C3's `Save game` and `Load game` system actions trigger `_saveToJson` / `_loadFromJson` on the behavior. All wave state and parameters are preserved. You do not need to manually save or restore any 2DWater state.
