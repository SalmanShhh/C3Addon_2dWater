# Construct 3 Addon Development — Skills Reference

Practical knowledge for building C3 plugins and behaviors with the **CAW (Construct Addon Wizard)** framework. Covers the C3 SDK runtime API, CAW patterns, ACE authoring, and common gotchas drawn directly from real addon development.

---

## Table of Contents

1. [Project Structure (CAW)](#1-project-structure-caw)
2. [config.caw.js — Addon Configuration](#2-configcawjs--addon-configuration)
3. [Instance Lifecycle](#3-instance-lifecycle)
4. [The Runtime API (`this.runtime`)](#4-the-runtime-api-thisruntime)
5. [Layer API](#5-layer-api)
6. [Instance API (`this`)](#6-instance-api-this)
7. [ACE Authoring](#7-ace-authoring)
8. [Parameter Types Reference](#8-parameter-types-reference)
9. [Property Types Reference](#9-property-types-reference)
10. [Triggers and Conditions](#10-triggers-and-conditions)
11. [The C3 Global (`self.C3`)](#11-the-c3-global-selfc3)
12. [C3 Debugger Support](#12-c3-debugger-support)
13. [Editor Instance (IInstanceBase / IWorldInstanceBase / IBehaviorInstanceBase)](#13-editor-instance)
14. [CAW Build & Dev Workflow](#14-caw-build--dev-workflow)
15. [Gotchas and Patterns](#15-gotchas-and-patterns)
16. [Behavior-Specific Patterns](#16-behavior-specific-patterns)
17. [Advanced Runtime Scripting API](#17-advanced-runtime-scripting-api)
18. [Index-Based Collection Iteration Pattern](#18-index-based-collection-iteration-pattern)
19. [SPOT Pattern — Shared State Across Behavior Instances](#19-spot-pattern--shared-state-across-behavior-instances)
20. [Editor Object Interfaces](#20-editor-object-interfaces)
21. [Model Interfaces (IProject / ILayout / ILayer / IEventSheet / IProjectFile)](#21-model-interfaces)
22. [Geometry Primitives (SDK.Rect / SDK.Quad / SDK.Color)](#22-geometry-primitives)
23. [Graphics Interfaces (IWebGLRenderer / IDrawParams / ILayoutView)](#23-graphics-interfaces)
24. [Remaining Object Interfaces (IImagePoint / IContainer / IFamily)](#24-remaining-object-interfaces)
25. [Physics Behavior API (IPhysicsBehavior / IPhysicsBehaviorInstance)](#25-physics-behavior-api-iphysicsbehavior--iphysicsbehaviorinstance)
26. [ISDKBehaviorInstanceBase — Runtime Behavior API](#26-isdkbehaviorinstancebase--runtime-behavior-api)
27. [ISDKInstanceBase — Runtime Plugin Instance API](#27-isdkinstancebase--runtime-plugin-instance-api)
28. [ISDKUtils — Runtime Utilities (`runtime.sdk`)](#28-isdkutils--runtime-utilities-runtimesdk)
29. [Physics Platformer — Scripting API Reference](#29-physics-platformer--scripting-api-reference)
30. [IRenderer — Runtime Rendering API](#30-irenderer--runtime-rendering-api)
31. [IMeshData — GPU Mesh Buffers](#31-imeshdata--gpu-mesh-buffers)
32. [ICollisionEngine Script Interface](#32-icollisionengine-script-interface)
33. [IStorage Script Interface](#33-istorage-script-interface)
34. [IAssetManager Script Interface](#34-iassetmanager-script-interface)
35. [IAABB3D Script Interface](#35-iaabb3d-script-interface)
36. [Instance & Behavior Instance Event Properties](#36-instance--behavior-instance-event-properties)
37. [ILoopingConditionContext — Looping Conditions](#37-iloopingconditioncontext--looping-conditions)
38. [IWorldInstance Script Interface](#38-iworldinstance-script-interface)
39. [IPlugin Script Interface](#39-iplugin-script-interface)
40. [IObjectClass Script Interface](#40-iobjectclass-script-interface)
41. [IObjectType Script Interface](#41-iobjecttype-script-interface)
42. [IFamily Script Interface](#42-ifamily-script-interface)
43. [IInstance Script Interface](#43-iinstance-script-interface)
44. [IDOMInstance Script Interface](#44-idominstance-script-interface)
45. [IBehaviorInstance Script Interface (Runtime)](#45-ibehaviorinstance-script-interface-runtime)
46. [IAnimationFrame Script Interface (Runtime)](#46-ianimationframe-script-interface-runtime)
47. [IAnimation Script Interface (Runtime)](#47-ianimation-script-interface-runtime)
48. [IRuntime Script Interface](#48-iruntime-script-interface)
49. [ILOSBehaviorInstance Script Interface](#49-ilosbehaviorinstance-script-interface)
50. [ISineBehaviorInstance Script Interface](#50-isinebehaviorinstance-script-interface)
51. [IAdvancedRandomObjectType Script Interface](#51-iadvancedrandomobjecttype-script-interface)
52. [I9PatchInstance Script Interface](#52-i9patchinstance-script-interface)
53. [I3DCameraObjectType Script Interface](#53-i3dcameraobjecttype-script-interface)
54. [IFileSystemObjectType Script Interface](#54-ifilesystemobjecttype-script-interface)
55. [IFileChooserInstance Script Interface](#55-ifilechooserinstance-script-interface)
56. [IDrawingCanvasInstance Script Interface](#56-idrawingcanvasinstance-script-interface)
57. [ISpriteInstance Script Interface](#57-ispriteinstance-script-interface)
58. [ITilemapInstance Script Interface](#58-itilemapinstance-script-interface)
59. [ITiledBackgroundInstance Script Interface](#59-itiledbackgroundinstance-script-interface)

---

## 1. Project Structure (CAW)

```
config.caw.js       ← Addon identity, properties, plugin type flags
version.js          ← Version string only
buildconfig.js      ← Build system options (cleanup, terser, warnings)
devConfig.js        ← Dev server port

src/
├── runtime/
│   ├── instance.js ← Main runtime class (all logic lives here)
│   ├── plugin.js   ← Runtime plugin class (rarely touched)
│   └── type.js     ← Runtime type class (rarely touched)
├── editor/
│   ├── instance.js ← Editor-side instance (property change handlers)
│   └── type.js     ← Editor type class
├── aces/
│   └── CategoryName/
│       ├── a.ActionName.js      ← Action   (prefix: a. or act.)
│       ├── c.ConditionName.js   ← Condition (prefix: c. or cnd.)
│       └── e.ExpressionName.js  ← Expression (prefix: e. or exp.)
└── domside/
    └── index.js    ← DOM-side script (only if hasDomside: true)

template/           ← DO NOT MODIFY — CAW internals
build/              ← DO NOT MODIFY — Build system
```

**ACE category folders** — folder name becomes the category ID. Use underscores (`Focus_Stack`), not spaces. Override display names in `config.caw.js` via `aceCategories`.

**Three ACE organization methods** — file-per-ACE in category folders (recommended), subfolders (`actions/`, `conditions/`, `expressions/`), or a single `src/aces.js` file.

---

## 2. config.caw.js — Addon Configuration

### Addon identity

```js
export const addonType = ADDON_TYPE.PLUGIN;   // or BEHAVIOR
export const type      = PLUGIN_TYPE.OBJECT;  // OBJECT, WORLD, or DOM
export const id        = "author_addonname";  // lowercase + underscores, globally unique
export const name      = "Display Name";
export const author    = "AuthorName";
export const version   = _version;            // from version.js
```

### Plugin type flags (`info.Set`)

```js
export const info = {
  Set: {
    IsSingleGlobal:    true,   // Only one instance allowed (global plugins)
    CanBeBundled:      true,
    IsDeprecated:      false,

    // World plugins only:
    IsResizable:       false,
    IsRotatable:       false,
    HasImage:          false,
    SupportsZElevation: false,
    SupportsColor:     false,
    SupportsEffects:   false,

    // Behavior only:
    IsOnlyOneAllowed:  false,
  },
  AddCommonACEs: {
    Position:   false,  // Adds standard x/y/z ACEs
    Size:       false,
    Angle:      false,
    Appearance: false,
    ZOrder:     false,
  },
};
```

### ACE category display names

```js
export const aceCategories = {
  MyCategory:     "My Category",
  Focus_Stack:    "Focus Stack",
  Layer_State:    "Layer State",
};
```

### File dependencies

```js
export const files = {
  fileDependencies:       [],          // Local files bundled into the addon
  remoteFileDependencies: [],          // External scripts (must be https://)
  cordovaPluginReferences:[],
  cordovaResourceFiles:   [],
  extensionScript: { enabled: false }, // Native wrapper extension (.dll)
};
```

---

## 3. Instance Lifecycle

Methods called by C3 in order. All are defined on the class returned by `instance.js`.

### `constructor()`

Called very early. **`this.runtime` is NOT available yet.** Only use for pure data initialization (Maps, arrays, primitives). Never call `this.runtime`, `this._getProperty()`, or any layer API here.

```js
constructor() {
  super();
  this._myData = new Map();

  // Enable the _tick(dt) callback every frame
  this._setTicking(true);

  // Read initial properties — safe here
  const props = this._getInitProperties();
  this._props = {
    myProp: props[0],  // index matches declaration order in config.caw.js
  };
}
```

### `onCreate()`

Called after the instance is fully created. **`this.runtime` is available.** Use for everything that needs the runtime: resolving layers, restoring saved state.

```js
onCreate() {
  this._debug = this._getProperty("debugMode");

  // Access layout/layers
  const layer = this.runtime.layout.getLayer("MyLayer");
}
```

### `_tick()`

Called every frame when ticking is enabled. Enable it once in `constructor()` with `this._setTicking(true)`. This is the correct C3 SDK way to run per-frame logic — do not use `this.runtime.addEventListener("tick", ...)`.

Delta time is **not** passed as a parameter — read it from `this.runtime.dt` (seconds) inside the method.

```js
constructor() {
  super();
  this._setTicking(true);  // must be called in constructor to enable _tick
}

_tick() {
  const dt = this.runtime.dt;        // seconds since last frame
  this._myTimer += dt;
  this._tickAnimations(dt * 1000);   // convert to ms if your logic needs it
}
```

### `_postCreate()` — behaviors only

Optional override called **after** the associated object instance has finished being created. The behavior constructor fires during instance creation, so the final state of `this.instance` is not yet ready. Use `_postCreate()` when you need to inspect or configure `this.instance` as soon as construction is complete — earlier than `_tick()` but later than `constructor()`.

```js
_postCreate() {
  // this.instance is fully ready here
  this._phys = this.instance.behaviors["Physics"] ?? null;
}
```

> **Behavior-only.** Plugins do not have `_postCreate()` — use `onCreate()` instead.

### `_tick2()` and `_postTick()`

Two additional per-frame hooks available alongside `_tick()`:

- **`_tick2()`** — called every tick **just after events are run** (after `_tick()`). Enable with `this._setTicking2(true)` in the constructor.
- **`_postTick()`** — called every tick **after all other behaviors have had their `_tick()` called**. Lets one behavior observe the state applied by other behaviors. Enable with `this._setPostTicking(true)` in the constructor.

> Prefer `_tick()` over `_postTick()` wherever possible. The post-ticking order between different behaviors is not reliable.

```js
constructor() {
  super();
  this._setTicking(true);      // enable _tick()  — runs before events
  this._setTicking2(true);     // enable _tick2() — runs after events
  this._setPostTicking(true);  // enable _postTick() — runs after all _tick() calls
}

_tick() {
  // Main per-frame update — use this for physics, movement, input
  const dt = this.runtime.dt;
}

_tick2() {
  // Secondary tick — runs after the event sheet for this frame
  // Good for reacting to event-sheet-driven state changes
}

_postTick() {
  // Post-tick — runs after all behaviors have ticked
  // Good for observing the final state of sibling behaviors
}
```

### Ticking utility methods

```js
// Start/stop ticking (call in constructor)
this._setTicking(true)       // enable _tick()
this._setTicking(false)      // disable _tick()  — stop ticking when no longer needed
this._setTicking2(true)      // enable _tick2()
this._setTicking2(false)
this._setPostTicking(true)   // enable _postTick()
this._setPostTicking(false)

// Query ticking state
this._isTicking()            // boolean — is _tick() currently enabled?
this._isTicking2()           // boolean — is _tick2() currently enabled?
this._isPostTicking()        // boolean — is _postTick() currently enabled?
```

> **Redundant calls are safe and ignored.** If you call `_setTicking(true)` three times then `_setTicking(false)` once, ticking is stopped — calls do **not** stack.

> **Stop ticking when idle** to reduce per-frame overhead. Re-enable when needed (e.g. enable on an event, disable after animation finishes).

### `_release()`

Called when the instance is destroyed. Clean up event listeners. Always call `super._release()`.

```js
_release() {
  super._release();
  // cleanup...
}
```

### `_saveToJson()` / `_loadFromJson(o)`

Called by C3 for savegames and `persistAcrossLayouts`. Return a plain serializable object. Restore from `o` in `_loadFromJson`.

```js
_saveToJson() {
  return { myData: [...this._myData.entries()] };
}

_loadFromJson(o) {
  this._myData = new Map(o.myData ?? []);
}
```

> **No `_restoredFromSave` guard needed.** C3's save/load flow is simply: `constructor()` runs first (initializing from editor properties), then `_loadFromJson(o)` runs and overwrites with the saved values. Every property you want persisted just needs to be in both methods. There is no need for a boolean flag to suppress `_getInitProperties()` on load — `_loadFromJson` overwrites the constructor values automatically.

---

## 4. The Runtime API (`this.runtime`)

Available from `onCreate()` onwards.

### Layout

```js
this.runtime.layout          // ILayout — the current layout
this.runtime.layout.name     // string — layout name
this.runtime.layout.width    // number — layout width in px
this.runtime.layout.height   // number
this.runtime.layout.getLayer("LayerName")         // ILayer | null
this.runtime.layout.moveLayerToIndex(ref, index)  // reorder layers (may not exist on older builds)
```

### Objects / Instances

```js
this.runtime.objects         // iterable of all IObjectType
this.runtime.objects.Sprite  // IObjectType for a specific object

// Addon SDK v2 naming: use 'instance' as the loop variable, not 'inst' or '_inst'
for (const objType of this.runtime.objects) {
  for (const instance of objType.getAllInstances()) {
    instance.x; instance.y; instance.layer; // IWorldInstance properties
    instance.timeScale = 1;                  // per-object timescale override
    instance.restoreTimeScale();             // revert to following global timescale
  }
}
```

### Timing

```js
this.runtime.dt         // Delta time in seconds (time since last frame) — read this inside _tick()
this.runtime.dt * 1000  // Delta time in milliseconds
```

### Events

```js
// Layout change events — use these when you need to react to layout transitions
this.runtime.addEventListener("beforelayout", () => {});  // layout about to change
this.runtime.addEventListener("afterlayout",  () => {});  // new layout started
```

> **Do not use `addEventListener("tick", ...)`** for per-frame logic. Use `_setTicking(true)` in `constructor()` and implement `_tick(dt)` instead — this is the correct C3 SDK approach.

---

## 5. Layer API

A layer reference (`ILayer`) returned by `runtime.layout.getLayer()`.

### Identity

```js
layer.name    // string — layer name (read-only)
layer.index   // number — zero-based Z-order index on its layout (bottom = 0, read-only)
layer.runtime // IRuntime — reference back to the runtime
layer.layout  // ILayout — the layout this layer belongs to
```

### Visibility

```js
layer.isVisible              // boolean — get/set: this layer's own visibility
layer.isSelfAndParentsVisible // boolean — read-only: true only if this layer AND all parents are visible
```

> Use `isSelfAndParentsVisible` when you need to know if the layer is actually drawn. A layer can have `isVisible = true` but still be hidden because a parent group is hidden.

### Interactivity

```js
layer.isInteractive              // boolean — get/set: this layer's own interactive state
layer.isSelfAndParentsInteractive // boolean — read-only: true only if this layer AND all parents are interactive
```

> Same caveat as visibility — a layer can be `isInteractive = true` but blocked by a non-interactive parent.

### Appearance

```js
layer.opacity         // number 0–1 — get/set (layer transparency)
layer.isTransparent   // boolean — get/set: if true, background color is ignored
layer.backgroundColor // [r, g, b] array (0–1 each) — get/set background color (ignored when transparent)
```

> `opacity` and `scrollX`/`scrollY` are not part of the scripting API spec but are valid layer properties in the addon SDK runtime context.

### Scroll position (used for slide animations)

```js
layer.scrollX  // number — horizontal scroll offset in px
layer.scrollY  // number — vertical scroll offset in px
```

### Hierarchy

```js
layer.parentLayer   // ILayer | null — direct parent layer, null if top-level

// Iterators
layer.subLayers()    // Iterator<ILayer> — direct sub-layers in Z order (direct children only)
layer.allSubLayers() // Iterator<ILayer> — ALL descendants recursively in Z order
layer.parentLayers() // Iterator<ILayer> — walks up the parent chain toward the root
```

> `allSubLayers()` is the preferred way to find a layer anywhere in a group hierarchy. Use `subLayers()` only when you specifically need direct children.

### Events

```js
layer.addEventListener("eventName", callback)
layer.removeEventListener("eventName", callback)
```

### Layer search scope — critical difference

```js
// Searches ALL layers in the current layout by name, any depth — always works
this.runtime.layout.getLayer("MyLayer")

// Searches only DIRECT children of a group layer — misses nested layers
groupLayerRef.getLayer("MyLayer")  // ✗ returns null if layer is more than 1 level deep
```

When resolving layers inside a container group, **never rely on `groupRef.getLayer()` alone**. It only searches direct children. Fall through to `allSubLayers()` (or a recursive search) for deeper nesting:

```js
_resolveLayer(name) {
  const containerRef = this.runtime.layout.getLayer(this._getProperty("uiContainerLayer"));
  if (!containerRef) return null;
  // Option A: fast path, but only works for direct children
  if (typeof containerRef.getLayer === "function") {
    const ref = containerRef.getLayer(name);
    if (ref) return ref;   // only accept non-null — fall through if null
  }
  // Option B: allSubLayers() iterates all descendants recursively
  if (typeof containerRef.allSubLayers === "function") {
    for (const layer of containerRef.allSubLayers()) {
      if (layer.name === name) return layer;
    }
    return null;
  }
  // Option C: manual recursive fallback for older C3 builds
  return this._resolveLayerInGroup(name, containerRef);
}
```

### Moving layers (Z-order)

```js
// Try runtime-level first, fallback to container-level
this.runtime.layout.moveLayerToIndex(layerRef, index);
containerRef.moveLayerToIndex(layerRef, index);
```

> **Note:** `moveLayerToIndex` may not exist on older C3 builds. Always feature-detect with `typeof ... === "function"` before calling.

---

## 6. Instance API (`this`)

Methods available on the runtime instance (inherited from the SDK base class).

### Property access

```js
this._getInitProperties()  // returns array of initial property values (constructor only)
// Index corresponds to declaration order in config.caw.js properties array
```

**Usage pattern in `constructor()`:**

```js
const properties = this._getInitProperties();
this._maxHealth      = properties[0];
this._invulnerable   = properties[1];
this._destroyOnDeath = properties[2];
```

> `_getInitProperties()` always returns the full array when called in `constructor()`. Direct index access is safe — no null check or ternary fallback needed.

### Triggering conditions

```js
// Fire a trigger condition — synchronous
// Plugins:
super._trigger(self.C3.Plugins["addon_id"].Cnds["ConditionMethodName"]);
// Behaviors:
super._trigger(self.C3.Behaviors["addon_id"].Cnds["ConditionMethodName"]);

// Fire a trigger — async (returns Promise, useful with C3 debugger breakpoints)
await this._triggerAsync(self.C3.Behaviors["addon_id"].Cnds["ConditionMethodName"]);
```

> In CAW, the framework `_trigger(method)` helper (Section 10) wraps `super._trigger` for you using the correct namespace automatically. Call `this._trigger("MethodName")` in instance code rather than `super._trigger(...)` directly.

### DOM-side communication (DOM plugins only)

```js
this._sendToDOM("message-id", data);
this._sendToDOMAsync("message-id", data);  // returns Promise
this._addDOMMessageHandler("reply-id", (data) => {});
```

---

## 7. ACE Authoring

### Action file (`a.ActionName.js`)

```js
export const config = {
  listName:    "Do something",          // shown in the action picker
  displayText: "Do {0} with {1}",       // shown in event sheet ({0} = first param)
  description: "What it does. Use for X.", // shown in tooltip — keep beginner-friendly
  isAsync:     false,
  highlight:   false,
  deprecated:  false,
  params: [
    {
      id:           "target",
      name:         "Target",
      desc:         "Param description.",
      type:         "string",          // see §8 for all types
      initialValue: '""',
    },
  ],
};

export const expose = true;  // true = method is copied onto the instance prototype

export default function (target) {
  // `this` is the runtime instance
  this._actDoSomething(target);
}
```

### Condition file (`c.ConditionName.js`)

```js
export const config = {
  listName:    "Is something true",
  displayText: "Is {0} true",
  description: "True when X. Use for Y.",
  isTrigger:   false,   // true = this is a trigger, not a polled condition
  isInvertible: true,   // false for triggers
  highlight:   false,
  deprecated:  false,
  params: [],
};

export const expose = false;

export default function () {
  return true; // must return boolean
}
```

### Trigger condition (conditions with `isTrigger: true`)

```js
export const config = {
  listName:    "On something happened",
  displayText: "On something happened",
  description: "Triggers when X. Use for Y.",
  isTrigger:   true,
  highlight:   false,
  deprecated:  false,
  params: [
    { id: "layerName", name: "Layer", desc: "The layer to watch.", type: "string", initialValue: '""' },
  ],
};

export default function (layerName) {
  return this._lastChangedLayer === layerName; // filter: only fire for the named layer
}

// To fire the trigger from instance.js:
// this._trigger("OnSomethingHappened");
```

### Expression file (`e.ExpressionName.js`)

```js
export const config = {
  returnType:  "string",  // "string", "number", or "any"
  description: "Returns X. Use for Y.",
  highlight:   false,
  deprecated:  false,
  params: [
    {
      id:   "layerName",
      name: "Layer name",
      desc: "The layer to query.",
      type: "string",
      // ⚠ DO NOT add initialValue to expression params — it is not supported
    },
  ],
};

export const expose = false;

export default function (layerName) {
  return this._layers.get(layerName)?.state ?? "";
}
```

### `expose` flag

- `true` — the default export function is **copied onto the instance prototype** under the PascalCase ACE ID (derived from the filename). The logic can live directly in the ACE — no separate private helper needed. Any other ACE can then call `this.AceName()` to invoke it.
- `false` — the function exists only as the ACE handler; not accessible as a method.

#### Prefer logic-in-ACE over delegation

When `expose: true`, write the logic directly in the default export instead of delegating to a private `_method`:

```js
// ✓ Preferred — logic lives in the ACE, exposed as this.SetBuffActive()
export const expose = true;
export default function (buffId, active) {
  const buff = this._buffMap.get(buffId);
  if (buff) buff.active = active;
}

// ✗ Unnecessary indirection — expose: true makes the private helper redundant
export const expose = true;
export default function (buffId, active) {
  this._setBuffActive(buffId, active);  // just calls a private copy of the same logic
}
```

Other ACEs call the exposed method by its PascalCase name (matching the filename):

```js
// In EnableDisableBuffsByTag, instead of calling a private _setBuffActive helper:
export default function (tag, active) {
  const matching = [];
  for (const [buffId, buff] of this._buffMap) {
    if (buff.tags.has(tag)) matching.push(buffId);
  }
  for (const buffId of matching) this.SetBuffActive(buffId, active); // calls the exposed ACE method
}
```

#### Identifying an addon's public scripting API

To enumerate everything callable from C3 Script or external JS:
- **PascalCase callable actions** — any ACE with `expose: true`. The method name matches the filename (`a.RemoveBuff.js` → `RemoveBuff()`).
- **Public getter/query methods** — any method on `src/runtime/instance.js` whose name does **not** start with `_`. These are camelCase helpers added directly to the class (not ACEs), used to expose read-only state that expressions cannot provide from script.

---

## 8. Parameter Types Reference

Used in ACE `params[].type`.

| Type | Description | Extra fields |
|---|---|---|
| `"string"` | Text input | `initialValue: '""'` |
| `"number"` | Numeric input | `initialValue: "0"` |
| `"any"` | Any expression (string or number) | `initialValue: '""'` |
| `"boolean"` | Checkbox | `initialValue: "false"` |
| `"combo"` | Dropdown | `initialValue: "key"`, `items: [{ key: "Label" }]` |
| `"object"` | Object picker | — |
| `"layer"` | Layer picker | — |
| `"layout"` | Layout picker | — |
| `"keyb"` | Keyboard key picker | — |

### Combo parameter example

```js
{
  id:           "animType",
  name:         "Animation",
  desc:         "The animation to play.",
  type:         "combo",
  initialValue: "fade",
  items: [
    { fade:       "Fade" },
    { slideLeft:  "Slide Left" },
    { slideRight: "Slide Right" },
    { none:       "None (instant)" },
  ],
}
```

> **Important:** `initialValue` for combo must match one of the item **keys** (not the display label).
> **Important:** Expression params do **not** support `initialValue` — omit it.

---

## 9. Property Types Reference

Used in `config.caw.js` `properties[]`. Each entry must have `type`, `id`, `name`, `desc`, and `options`.

| Type | Description | Key options |
|---|---|---|
| `PROPERTY_TYPE.TEXT` | Single-line text input | `initialValue: ""` |
| `PROPERTY_TYPE.LONGTEXT` | Multi-line text input | `initialValue: ""` |
| `PROPERTY_TYPE.INTEGER` | Whole number | `initialValue: 0`, `minValue`, `maxValue` |
| `PROPERTY_TYPE.FLOAT` | Decimal number | `initialValue: 0.0` |
| `PROPERTY_TYPE.PERCENT` | 0–1 stored, shown as 0–100% | `initialValue: 0.5` |
| `PROPERTY_TYPE.CHECK` | Boolean checkbox | `initialValue: false` |
| `PROPERTY_TYPE.COMBO` | Dropdown | `initialValue: "key"`, `items: [{ key: "Label" }]` |
| `PROPERTY_TYPE.COLOR` | Color picker | `initialValue: [r, g, b]` (0–1 each) |
| `PROPERTY_TYPE.OBJECT` | Object reference picker | — |
| `PROPERTY_TYPE.GROUP` | Group header (no value) | — |
| `PROPERTY_TYPE.FONT` | Font picker | — |
| `PROPERTY_TYPE.LINK` | Clickable link | `linkCallback`, `callbackType` |
| `PROPERTY_TYPE.INFO` | Read-only info text | — |

### Property declaration order is critical

`_getInitProperties()` returns properties as a plain array. Index 0 is the first declared property, index 1 is the second, and so on. Document the index mapping in a comment.

```js
// 0: myText  1: myNumber  2: myCheck
export const properties = [
  { type: PROPERTY_TYPE.TEXT,    id: "myText",   ... },
  { type: PROPERTY_TYPE.INTEGER, id: "myNumber", ... },
  { type: PROPERTY_TYPE.CHECK,   id: "myCheck",  ... },
];
```

---

## 10. Triggers and Conditions

### Firing a trigger from instance code

Use the CAW framework `_trigger()` helper (wraps `dispatch` + `super._trigger`):

```js
// In instance.js — after some event happens:
this._trigger("OnLayerStateChanged");
```

The string must exactly match the ACE method name (the function name used in the condition file's default export, or the generated method name from the file name).

### How C3 maps condition file names to method names

CAW generates a method name from the file name:
- `c.LayerIsAnimating.js` → method `LayerIsAnimating`
- `cnd.OnScreenShown.js` → method `OnScreenShown`

The method name passed to `_trigger()` or `super._trigger()` must match this exactly (case-sensitive).

### Trigger with a filter parameter

When a trigger has a param (e.g. a layer name), the condition function's return value acts as a filter — C3 only fires the event for listeners where the function returns `true`:

```js
export default function (layerName) {
  return this._lastChangedLayer === layerName;
}
```

Store the "current" value (`_lastChangedLayer`) before calling `_trigger()`.

### CAW _trigger helper (framework-specific)

```js
_trigger(method) {
  this.dispatch(method);                                         // CAW event system
  super._trigger(self.C3.Plugins[id].Cnds[method]);             // C3 native trigger
}
```

---

## 11. The C3 Global (`self.C3`)

At runtime everything lives under `self.C3`:

```js
self.C3.Plugins["addon_id"]          // plugin namespace
self.C3.Plugins["addon_id"].Cnds     // all condition functions (for triggers)
self.C3.Plugins["addon_id"].Acts     // all action functions
self.C3.Plugins["addon_id"].Exps     // all expression functions

self.C3.Behaviors["addon_id"]        // same but for behaviors
```

Use `AddonTypeMap[addonType]` (imported from `template/addonTypeMap.js`) to get the right key (`"Plugins"` or `"Behaviors"`) without hardcoding it.

---

## 12. C3 Debugger Support

Implement `_getDebuggerProperties()` on the instance class to expose live state in the C3 Debugger panel (F12 during preview).

```js
_getDebuggerProperties() {
  const sections = [];

  // Each section = one collapsible group in the panel
  sections.push({
    title: `$${this.type.name} — Summary`,   // plugins: this.type.name
    properties: [
      { name: "$Active item",  value: this._activeItem ?? "(none)" },
      { name: "$Total items",  value: this._items.size },
      { name: "$Debug mode",   value: this._debug,  onedit: v => { this._debug = !!v; } },
      { name: "$Max speed",    value: this._maxSpeed, onedit: v => { this._maxSpeed = +v; } },
    ],
  });

  // Per-item section
  for (const item of this._items.values()) {
    sections.push({
      title: `$Item: ${item.id}`,
      properties: [
        { name: "$State", value: item.state },
        { name: "$Value", value: item.value },
      ],
    });
  }

  return sections; // return the array of section objects
}
```

### Rules

- `title` — string shown as the section header
- `properties` — array of `{ name: string, value: any }`
- `value` can be a string, number, or boolean — C3 renders it automatically
- The method is called every frame by the debugger; keep it fast (no heavy computation)
- No setup needed in `config.caw.js` — C3 calls it automatically if it exists

### Making properties editable

Add an `onedit` callback to any property entry to make it editable in the debugger panel. The user can click the value to change it live without restarting the layout:

```js
// Read-only (no onedit)
{ name: "$Jumps remaining", value: this._jumpsRemaining }

// Editable number
{ name: "$Max speed", value: this._maxSpeed, onedit: v => { this._maxSpeed = +v; } }

// Editable number with clamping
{ name: "$Max jumps", value: this._maxJumps, onedit: v => { this._maxJumps = Math.max(0, Math.floor(+v)); } }

// Editable boolean — renders as a toggle
{ name: "$Variable jump", value: this._variableJump, onedit: v => { this._variableJump = !!v; } }

// Editable boolean that calls a method (preferred when setX() has side-effect cleanup)
{ name: "$Enabled", value: this._enabled, onedit: v => { this.setEnabled(!!v); } }
```

**Key name:** `onedit` — not `callback`. Using `callback` silently does nothing.

**Value is always a string** when `onedit` is called, even for numeric properties. Always coerce: `+v` for numbers, `!!v` for booleans.

**Booleans render as a toggle** (checkbox) when the current `value` is `true` or `false`. The `onedit` callback receives the new boolean value as a string `"true"` / `"false"` — use `!!v` or `v === "true"` to coerce correctly.

### Translation strings — IMPORTANT

C3 treats every `title` and `name` string as a **translation key** and looks it up in the addon's translation file. If the key is missing, C3 logs an error every frame.

**Prefix all `title` and `name` strings with `$`** to mark them as literal strings that skip translation lookup:

```js
{ name: "$Active screen", value: ... }   // ✓ — literal string, no lookup, no error
{ name: "Active screen",  value: ... }   // ✗ — treated as a translation key, logs error if missing
```

**Do not add debugger strings to the translation file manually.** CAW regenerates the translation file on every build and will overwrite manual additions. The `$` prefix is the correct and only approach.

### Section title best practice

Use the addon's type name so the section title is always correct, regardless of how the user renames the object:

```js
// Plugins:
title: `$${this.type.name} — Summary`

// Behaviors:
title: `$${this.behaviorType.name} — Summary`
```

---

## 13. Editor Instance

`src/editor/instance.js` — runs in the **editor** (not at game runtime). There are three base classes depending on the plugin type. All live in the editor module; none of this code runs at runtime.

### Class hierarchy

```
IInstanceBase
  └── IWorldInstanceBase     (world-type plugins only — has a canvas presence)
IBehaviorInstanceBase        (behaviors — separate hierarchy)
```

---

### IInstanceBase — plugins (Object and World types)

Base class for all editor-side plugin instances. Provides access to the project model and editor object interfaces.

#### Properties

```js
this._sdkType       // Reference to the associated SDK type class
this._inst          // IObjectInstance (or IWorldInstance for world plugins) — editor interface
```

#### Methods

```js
// Lifecycle — all optional overrides
OnCreate()                         // Called when instance is first created in the editor
OnPropertyChanged(id, value)       // Called when any property changes in the Properties Bar
Release()                          // Called when the instance is deleted from the editor

// Construct 2 compatibility — optional override
LoadC2Property(name, valueString)  // Custom logic for importing a property from a C2 project

// Project model accessors
GetProject()      // Returns IProject — the project this instance belongs to
GetObjectType()   // Returns IObjectType — the object type for this instance
GetInstance()     // Returns IObjectInstance — the editor interface for this instance
```

#### Minimal plugin editor instance

```js
export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
    }

    OnCreate() {}

    OnPropertyChanged(id, value) {
      if (id === "myProperty") {
        // React to the property change in the editor
      }
    }

    Release() {}
  };
}
```

---

### IWorldInstanceBase — world-type plugins only

Derives from `IInstanceBase`. Add these overrides when your plugin has a visible canvas presence (sprites, tiles, custom draw). `OnPlacedInLayout()` is also called for non-world plugins placed from the object panel.

#### Methods

```js
// Called when the user explicitly drags the instance onto the layout.
// Best place to set initial size, origin, or other first-placement defaults.
OnPlacedInLayout() {}

// Called each time Construct redraws the Layout View for this instance.
// iRenderer  — IWebGLRenderer, used for issuing draw commands
// iDrawParams — IDrawParams, provides additional draw context
Draw(iRenderer, iDrawParams) {}

// Asynchronous texture loading from an IAnimationFrame.
// Returns null while loading; returns IWebGLTexture once ready.
// Construct refreshes the Layout View automatically when the texture resolves.
// Best practice: render a semitransparent placeholder while null.
GetTexture(animationFrame) {}

// After a texture loads, returns an SDK.Rect describing the image region
// in texture coordinates. Due to Construct's spritesheeting, this is
// often a subset of the full texture — always use this, never assume 0,0,1,1.
GetTexRect() {}

// Returns true if the most recent texture load failed.
// Plugins typically switch the placeholder to a red color in this case.
HadTextureError() {}

// Optional: enables percentage-size options in the Properties Bar.
// Override all three together. Return true from IsOriginalSizeKnown()
// and the correct pixel dimensions from the other two.
IsOriginalSizeKnown() { return false; }  // default — disables the feature
GetOriginalWidth()    { return 0; }
GetOriginalHeight()   { return 0; }

// Optional: enables double-click / double-tap interaction in the Layout View.
// Also adds an "Edit" option to the context menu.
// Typical use: open the image editor for image-based plugins.
// Override both together — HasDoubleTapHandler() must return true to enable OnDoubleTap().
HasDoubleTapHandler() { return false; }  // default — disabled
OnDoubleTap()         {}
```

#### Texture loading pattern

```js
Draw(iRenderer, iDrawParams) {
  const texture = this.GetTexture(this._inst.GetFirstAnimationFrame());

  if (texture === null) {
    if (this.HadTextureError()) {
      // Draw a red error placeholder
      iRenderer.SetColorFillMode();
      iRenderer.SetColor(1, 0, 0, 0.5);
      iRenderer.Rect(iDrawParams.GetLayoutRect());
    } else {
      // Draw a neutral loading placeholder
      iRenderer.SetColorFillMode();
      iRenderer.SetColor(0.5, 0.5, 0.5, 0.3);
      iRenderer.Rect(iDrawParams.GetLayoutRect());
    }
    return;
  }

  // Texture is ready — use GetTexRect() for the correct UV region
  const texRect = this.GetTexRect();
  iRenderer.SetTexture(texture);
  iRenderer.TexturedRect(iDrawParams.GetLayoutRect(), texRect);
}
```

#### Original size example

```js
// Enables "100%" / "50%" size shortcuts in the Properties Bar
IsOriginalSizeKnown() { return true; }
GetOriginalWidth()    { return this._originalWidth; }
GetOriginalHeight()   { return this._originalHeight; }
```

---

### IBehaviorInstanceBase — behaviors

Separate hierarchy from `IInstanceBase`. The editor-side behavior instance has its own set of properties and methods.

#### Properties

```js
this._sdkBehaviorType   // Reference to the associated SDK behavior type class
this._behaviorInstance  // IBehaviorInstance — the editor interface for this behavior instance
```

#### Methods

```js
// Lifecycle — all optional overrides
OnPropertyChanged(id, value)  // Called when any property changes in the Properties Bar
OnAddedInEditor()             // Called when the user first adds this behavior to an object
                              // in the editor. Good place to set initial property defaults.

// Accessors
GetBehaviorInstance()   // Returns IBehaviorInstance — the editor interface for this behavior
GetSdkBehaviorType()    // Returns the associated SDK behavior type class
```

#### Minimal behavior editor instance

```js
export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
    }

    OnAddedInEditor() {
      // Set initial property defaults when the behavior is first added
    }

    OnPropertyChanged(id, value) {
      if (id === "myProp") {
        // React to property changes
      }
    }
  };
}
```

> **`OnAddedInEditor()` vs `OnCreate()`** — `OnAddedInEditor()` fires only when the user actively adds the behavior from the editor UI (a one-time setup opportunity). `OnCreate()` (on `IInstanceBase`) fires every time an instance is created in the editor, including on project load.

---

## 14. CAW Build & Dev Workflow

### Commands

```bash
npm run dev    # Start dev server with hot reload. URL shown in terminal.
npm run build  # Production build → {id}-{version}.c3addon in project root
```

### Dev server

- When `.dev-server-running` exists in the project root, the server is already running
- The dev server rebuilds on every file save — do **not** run `npm run build` to check for errors; just save and watch the terminal
- Use the localhost URL in Construct 3 (File → New tab, paste the URL) to test live

### Build output

```
{id}-{version}.c3addon   ← final file to distribute
dist/                    ← intermediate build artifacts (auto-cleaned)
generated/               ← generated ACE files (auto-cleaned)
```

### buildconfig.js options

```js
export const cleanup = {
  keepExport:     false,  // Keep dist/export folder after build
  keepExportStep: false,  // Keep intermediate export step files
  keepGenerated:  false,  // Keep generated/ folder
};
export const terserValidation = "error";  // "error" | "warning" | "skip"
export const disableTips      = false;
export const disableWarnings  = false;
```

---

## 15. Gotchas and Patterns

### `this.runtime` is unavailable in `constructor()`

Use `onCreate()` for anything that needs the runtime, layout, or layers.

### C3 can call ACE actions before `onCreate()` fires

**All data structures (Maps, Sets, arrays) must be initialized in `constructor()`, not `onCreate()`.**

C3's lifecycle does not guarantee that `onCreate()` runs before event sheet actions. If the user places an action early in the event sheet (e.g. on Start of Layout), C3 may call it before `onCreate()` completes. Any property accessed before initialization will throw.

```js
// ✗ WRONG — _layers is undefined if an action fires before onCreate()
onCreate() {
  this._layers = new Map();
}

// ✓ CORRECT — always safe to access from any ACE
constructor() {
  super();
  this._layers    = new Map();
  this._focusStack = [];
  this._popupStack = [];
}
onCreate() {
  // Only things that genuinely require this.runtime go here
  this._containerRef = this.runtime.layout.getLayer(this._getProperty("uiContainerLayer"));
}
```

Rule of thumb: initialize data in `constructor()`, resolve runtime/layout refs in `onCreate()`.

### Property index order is fixed

`_getInitProperties()` returns values by **position**, not by name. If you reorder properties in `config.caw.js`, update all index references in `constructor()`. Always document the mapping with a comment.

### Expression params do not support `initialValue`

Unlike action/condition params, expression params must **not** have `initialValue`. Including it causes a build warning or error.

### Combo `initialValue` must be the key, not the label

```js
items: [{ fade: "Fade" }, { slideLeft: "Slide Left" }]
initialValue: "fade"  // ✓ correct — the key
initialValue: "Fade"  // ✗ wrong — the display label
```

### Do not call C3 layer APIs on untrusted layer refs

Always null-check layer refs before reading `visible`, `interactive`, etc. Layer refs can be null if the named layer doesn't exist or hasn't been resolved yet.

```js
if (entry?.ref) {
  entry.ref.visible = false;
}
```

### `moveLayerToIndex` feature detection

Not all C3 builds expose this method. Always guard:

```js
if (typeof this.runtime.layout.moveLayerToIndex === "function") {
  this.runtime.layout.moveLayerToIndex(ref, index);
} else if (typeof this._containerRef.moveLayerToIndex === "function") {
  this._containerRef.moveLayerToIndex(ref, index);
}
```

### Triggers must set state before firing

Store the "current value" in an instance variable first, then call `_trigger()`. Condition filter functions read those variables when C3 evaluates listeners.

```js
this._lastChangedLayer = layerName;
this._lastChangedState = newState;
this._trigger("OnLayerStateChanged");
```

### `IsSingleGlobal: true` — one instance, global scope

When set, only one instance of the plugin can exist. There are no per-object instances. The plugin object is shared across the whole project. This is the right choice for manager-type plugins (UI systems, audio managers, save systems).

### `IsSingleGlobal` — cached layer refs go stale on layout change

`onCreate()` is called **only once** for a `IsSingleGlobal` plugin (on first layout). If the user navigates to a different layout, any layer ref cached in `onCreate()` now points to a **destroyed layer from the previous layout**.

**Never cache a layer ref across layouts.** Always resolve fresh from the current layout inside the action or helper method:

```js
// ✗ WRONG — stale after layout change
onCreate() {
  this._containerRef = this.runtime.layout.getLayer("UI Container");
}
_resolveLayer(name) {
  return this._containerRef?.getLayer(name) ?? null;  // null after layout change
}

// ✓ CORRECT — resolves against the current live layout every time
_getContainerRef() {
  return this.runtime.layout.getLayer(this._getProperty("uiContainerLayer")) ?? null;
}
_resolveLayer(name) {
  const container = this._getContainerRef();
  if (!container) return null;
  if (typeof container.getLayer === "function") {
    const ref = container.getLayer(name);
    if (ref) return ref;
  }
  return this._resolveLayerInGroup(name, container);
}
```

It is fine to cache the ref for the **duration of a single action** (local variable). The problem is storing it as `this._containerRef` and reusing it across actions/ticks/layouts.

### `expose: true` copies the ACE function onto the instance prototype

The method name on the prototype is the **PascalCase ACE ID** derived from the filename (`a.SetBuffActive.js` → `this.SetBuffActive()`). Write the logic directly in the ACE's default export — no private `_helper` method needed. Any ACE with `expose: true` is automatically callable from other ACEs, from `instance.js`, and from C3 Script.

Use `expose: false` for ACEs that only need to run as event sheet actions and don't need to be called from anywhere else.

### Async actions

```js
export const config = { isAsync: true, ... };

export default async function () {
  await someAsyncOperation();
}
```

C3 will `await` the returned Promise before continuing to the next action in the event sheet.

### DOM-side plugins

When `hasDomside: true`, `src/domside/index.js` runs in the DOM context (separate from the C3 runtime sandbox). Use `this._sendToDOM()` / `this._addDOMMessageHandler()` to communicate between the two sides.

### Group layer iteration compatibility

Different C3 builds expose either `subLayers()` or `layers()` on group layer refs. Check for both:

```js
const iter = typeof layerRef.subLayers === "function"
  ? layerRef.subLayers()
  : typeof layerRef.layers === "function"
    ? layerRef.layers()
    : null;
```

### `this` context in ACE default exports

The `export default function` is called with `this` bound to the runtime instance. Arrow functions would lose this binding — always use `function` keyword:

```js
export default function (param) {  // ✓
  this._doSomething(param);
}

export default (param) => {        // ✗ — `this` is undefined
  this._doSomething(param);
}
```

---

## 16. Behavior-Specific Patterns

Behaviors differ from plugins in important ways. `this` in a behavior runtime instance is **the behavior**, not the C3 object it is attached to.

### `this` vs `this.instance`

```js
this           // the behavior runtime instance (ACE methods, _tick, _trigger, etc.)
this.instance  // the IWorldInstance the behavior is attached to (x, y, behaviors, width, height, etc.)
this.instance.runtime  // the IRuntime — same as C3's scripting runtime (available from onCreate() onwards)
```

### `this.instance` is NULL in the behavior `constructor()`

The attached instance is not wired up yet when the constructor runs. Accessing it will throw.

```js
constructor() {
  super();
  this._setTicking(true);
  // ✗ DO NOT: this.instance.x — throws, instance is null
  // ✗ DO NOT: this.instance.behaviors — throws
  // ✓ Safe: primitives, Maps, Arrays, _getInitProperties()
}

_tick() {
  if (!this._initialized) {
    this._initialized = true;
    // ✓ Safe to access this.instance here
    this._setup();
  }
}
```

### `this.instance.behaviors` is an object, not an array

It is keyed by the behavior's internal name string, **not** an iterable array. Attempting `for...of` throws `TypeError: not iterable`.

```js
// ✗ WRONG — throws TypeError
for (const b of this.instance.behaviors) { ... }

// ✓ CORRECT — iterate keys
for (const key of Object.keys(this.instance.behaviors)) {
  const b = this.instance.behaviors[key];
}

// ✓ CORRECT — values directly
for (const b of Object.values(this.instance.behaviors)) {
  if (b.behaviorType?.name === "Platform") { ... }
}
```

### Identifying behaviors by type name

C3 behavior type names are exact strings. Use `behaviorType.name` to identify them reliably without hardcoding the user's behavior key:

```js
// Known C3 behavior type names:
// "Platform", "Solid", "Jumpthru", "Physics", "Bullet", "Pathfinding"

function _findPlatformBehavior() {
  for (const b of Object.values(this.instance.behaviors)) {
    if (b.behaviorType?.name === "Platform") return b;
  }
  return null;
}
```

### Accessing Platform behavior properties from another behavior

```js
const plat = this._findPlatformBehavior();
if (plat) {
  const maxSpeed      = plat.maxSpeed;       // px/s
  const jumpStrength  = plat.jumpStrength;   // px/s
  const gravity       = plat.gravity;        // px/s²
  const isOnFloor     = plat.isOnFloor;
  const isJumping     = plat.isJumping;
  const isFalling     = plat.isFalling;
  plat.vectorX = 200;   // set horizontal velocity directly
  plat.vectorY = -400;  // set vertical velocity directly (negative = up)
}
```

### Combo ACE parameters are numeric indices at runtime

C3 passes combo parameters as a **0-based index number**, not the key string. The same applies whether the combo is in an action, condition, or expression.

```js
// In aces.js:
items: [{ balanced: "Balanced" }, { shortest: "Shortest" }, { safest: "Safest" }]
initialValue: "balanced"

// At runtime, the ACE function receives:  0  (not "balanced")

// ✗ WRONG — always false, value is a number
export default function (strategy) {
  if (strategy === "balanced") { ... }
}

// ✓ CORRECT — map index → key first
export default function (strategy) {
  const s = this._combo(strategy, ["balanced", "shortest", "safest"]);
  if (s === "balanced") { ... }
}
```

Add this helper to `instance.js`:

```js
_combo(value, keys) {
  return keys[value] ?? keys[0];
}
```

> **Note:** Property combos from `_getInitProperties()` also arrive as 0-based indices. Use the same mapping pattern: `const strategyMap = ["balanced", "shortest", "safest"]; const s = strategyMap[properties[6]];`

### Combo item keys must not contain hyphens

```js
// ✗ WRONG — value will NOT equal "one-way" at runtime (comparison always fails)
items: [{ "one-way": "One-way" }, { "two-way": "Two-way" }]

// ✓ CORRECT — underscore keys work correctly
items: [{ one_way: "One-way" }, { two_way: "Two-way" }]
```

### Conditions and expressions share the same ACE ID namespace

In CAW, condition and expression ACE IDs must be globally unique across both types. A condition named `IsAtPortal` blocks an expression also named `IsAtPortal` — one silently wins.

```js
// ✗ WRONG — namespace collision, one will override the other
condition("Portals", "IsAtPortal", { ... }, function() { return ...; });
expression("Portals", "IsAtPortal", { ... }, function() { return ...; });

// ✓ CORRECT — use distinct names
condition("Portals", "IsAtPortal",       { ... }, function() { return ...; });  // condition
expression("Portals", "PortalIsActive",  { ... }, function() { return ...; });  // expression
```

### Every `this.aceXxx()` call must have a matching method

If an ACE calls `this.aceDoSomething(x, y)` but `aceDoSomething` is not defined on the instance, it fails silently at runtime with no error. Always cross-check after editing `aces.js` and `instance.js` separately.

---

## 17. Advanced Runtime Scripting API

These APIs are accessible from within behavior/plugin code via `this.instance.runtime` (behaviors) or `this.runtime` (plugins). They match C3's scripting API (`IRuntime`).

### Spatial collision queries

```js
// Efficient broadphase query — returns instances overlapping a rect
// Much faster than getAllInstances() + manual distance checks
const candidates = this.instance.runtime.collisions.getCollisionCandidates(
  [objectTypeA, objectTypeB],   // array of IObjectType references
  { left: x, top: y, right: x + w, bottom: y + h }  // plain rect object or DOMRect
);

// May return duplicates — always deduplicate
const unique = new Set(candidates);
for (const inst of unique) {
  // inst is an IWorldInstance
}
```

### Detecting object capabilities at runtime

```js
// Is an instance a Tilemap? (tilemaps have getTileAt, regular sprites don't)
if (typeof inst.getTileAt === "function") {
  const tileId = inst.getTileAt(gx, gy);  // returns tile ID, -1 if empty
}

// Does an instance have a specific behavior enabled?
for (const b of Object.values(inst.behaviors)) {
  if (b.behaviorType?.name === "Solid" && b.isEnabled) {
    // this is an active solid object
  }
  if (b.behaviorType?.name === "Jumpthru" && b.isEnabled) {
    // this is an active one-way platform
  }
}
```

### Collision polygon vertices

```js
// Get the collision polygon for the current animation frame (normalized 0–1 coords)
const frame = inst.animation.currentFrame;
const count = frame.getPolyPointCount();

for (let i = 0; i < count; i++) {
  // Normalized → world space
  const wx = inst.x + (frame.getPolyPointX(i) - 0.5) * inst.width;
  const wy = inst.y + (frame.getPolyPointY(i) - 0.5) * inst.height;
}
```

> Polygon points are normalized to 0–1 relative to the sprite's bounding box. Multiply by `inst.width`/`inst.height` and offset by `inst.x`/`inst.y` (the instance origin, typically center) to get world-space coordinates. Useful for accurate obstacle rasterization instead of bounding-box fill.

### Getting an instance by UID

```js
const inst = this.instance.runtime.getInstanceByUid(uid);
if (inst === null) {
  // Instance was destroyed — remove from any tracking structures
}
```

### Layout and grid access

```js
this.instance.runtime.layout.width   // total layout pixel width
this.instance.runtime.layout.height  // total layout pixel height

// Iterating all instances of a known object type
for (const inst of this.instance.runtime.objects.MyObjectName.getAllInstances()) {
  inst.x; inst.y;
}
```

---

## 18. Index-Based Collection Iteration Pattern

When an addon exposes a variable-length list of items (abilities, tags, waypoints, etc.), the idiomatic C3 event sheet iteration is **Count + Index** — not a comma-separated string with `tokencount`/`tokenat`.

### The pattern

Expose two ACEs:

```js
// Expression: count
expression("MyCategory", "CountItems", {
  returnType: "number",
  description: "Number of items in the list.",
  params: [],
}, function () {
  return this._items.size;
});

// Expression: item by index
expression("MyCategory", "GetItemByIndex", {
  returnType: "string",
  description: "Get the item ID at the given 0-based index. Returns empty string if out of bounds.",
  params: [
    { id: "index", name: "Index", desc: "0-based position.", type: "number" },
  ],
}, function (index) {
  return Array.from(this._items.keys())[index] ?? "";
});
```

In the event sheet the user then writes a standard `Repeat` loop:

```
Repeat MyBehavior.CountItems() times
  Local: item = MyBehavior.GetItemByIndex(loopindex)
  → actions using item
```

`loopindex` is a built-in C3 expression that equals the current iteration (0, 1, 2, …).

### Variant: filtered list by tag

When the list is filtered by a runtime value (e.g. abilities with a specific tag), the index expression accepts the filter as a parameter:

```js
// Expression: count with filter
expression("Tags", "CountAbilitiesByTag", {
  returnType: "number",
  params: [{ id: "tag", name: "Tag", type: "string" }],
}, function (tag) {
  return this._abilitiesWithTag(tag).length;
});

// Expression: item by index with filter
expression("Tags", "GetAbilityByTagIndex", {
  returnType: "string",
  params: [
    { id: "tag",   name: "Tag",   type: "string" },
    { id: "index", name: "Index", type: "number" },
  ],
}, function (tag, index) {
  return this._abilitiesWithTag(tag)[index] ?? "";
});
```

Event sheet usage:

```
Repeat Player.SimpleAbilities.CountAbilitiesByTag("offensive") times
  Local: abilityID = Player.SimpleAbilities.GetAbilityByTagIndex("offensive", loopindex)
  → Condition: Is ability ready abilityID
  → Action: Activate ability abilityID
```

### Why not a comma-separated string?

| Approach | Pros | Cons |
|---|---|---|
| `tokencount`/`tokenat` on a string | No extra expression needed | Non-idiomatic; string parsing is fragile; `tokenat` is O(n²) on large lists |
| **Count + Index** (this pattern) | C3-native `Repeat` loop; clean `loopindex`; O(1) per access | Requires two expressions instead of one |

The Count + Index pattern also avoids edge cases with ability IDs that contain commas.

### Internal helper

The internal JS helper that both expressions share can be any function returning an ordered array:

```js
_abilitiesWithTag(tag) {
  const result = [];
  for (const [id, ability] of this._abilities) {
    if (ability.tags && ability.tags.has(tag)) result.push(id);
  }
  return result;
}
```

For very large collections, cache this result per-frame and invalidate when the collection changes.

---

## 19. SPOT Pattern — Shared State Across Behavior Instances

> **This is a last-resort workaround, not a general pattern.** Before using it, ask whether a separate plugin with `IsSingleGlobal: true` would serve instead — that is the clean C3-native answer for singletons and avoids all of the complexity below.

Behaviors don't have true static class members in C3's module system. The **Shared Per-Object-Type (SPOT)** pattern uses a module-scope `Map` to simulate a singleton shared between all instances of the same behavior.

### When you actually need this

You only need SPOT when you simultaneously require **both** of the following:

1. **Per-instance behavior** — each object needs its own `_tick`, its own ACE context, its own runtime state (e.g. current path, movement phase, waypoints)
2. **Cross-instance shared data** — some expensive structure (a navigation graph, a physics world, a shared connection pool) that all instances of the same type should read from one copy rather than rebuild independently

If you only need a singleton and don't need per-instance `_tick` or per-instance ACE context, use `IsSingleGlobal: true` on a separate plugin. That gives you a proper C3-visible singleton with no workarounds, no stale-key handling, and no restart edge cases — at the cost of a second addon dependency for users.

The navigation graph in this addon is the archetypal SPOT use case: each character needs independent path and movement state, but rebuilding the entire walkability graph once per character would be wasteful. The graph is shared; the path is not.

### Basic structure

```js
// At the TOP of instance.js — module scope, outside the class
const _sharedManagers = new Map();  // keyed by layoutUID or objectTypeUID

export default function (parentClass) {
  return class extends parentClass {

    _getOrCreateManager() {
      const key = this.instance.runtime.layout.uid ?? "global";
      if (!_sharedManagers.has(key)) {
        _sharedManagers.set(key, {
          graph: null,
          nodes: [],
          initialized: false,
        });
      }
      return _sharedManagers.get(key);
    }

    _tick() {
      if (!this._initialized) {
        this._initialized = true;
        this._manager = this._getOrCreateManager();
        // First instance creates the shared data; later instances reuse it
        if (!this._manager.initialized) {
          this._manager.initialized = true;
          this._buildSharedGraph();
        }
      }
    }
  };
}
```

### Layout restart / scene reload

On layout restart, C3 destroys and recreates all instances. The module-scope `Map` persists (JS module is not reloaded). Stale keys must be detected and cleared:

```js
_getOrCreateManager() {
  const key = this.instance.runtime.layout.uid;
  const existing = _sharedManagers.get(key);
  if (existing && existing.layoutUID !== key) {
    // Stale entry from a previous run — purge it
    _sharedManagers.delete(key);
  }
  if (!_sharedManagers.has(key)) {
    _sharedManagers.set(key, { layoutUID: key, graph: null, initialized: false });
  }
  return _sharedManagers.get(key);
}
```

### When to use SPOT vs per-instance state

| Data | Where to store |
|---|---|
| Navigation graph, obstacle map, shared pathfinding data | Module-scope Map (SPOT) |
| Per-character path, current waypoint, movement state | Instance properties (`this._path`, etc.) |
| Debug settings that apply to all agents | Module-scope Map (SPOT) |
| Character-specific properties (speed overrides, target) | Instance properties |

### Prefer `IsSingleGlobal: true` when possible

For most shared-state needs (audio managers, save systems, UI controllers, game state), a separate plugin with `IsSingleGlobal: true` is the correct answer. It gives a proper C3-native singleton: one object on the layout, globally accessible ACEs, no module-scope Map, no stale-key detection, no restart edge cases.

```js
// config.caw.js of a manager plugin
export const info = {
  Set: { IsSingleGlobal: true }
};
```

Use SPOT only when you've ruled this out — typically because splitting into two addons would mean the behavior needs to reach back into the plugin for data on every tick, and the inter-addon lookup cost or coupling becomes its own problem.

---

## 20. Editor Object Interfaces

These interfaces are the **editor-side** object model — they live in `src/editor/` code, not the runtime. They are what `this._inst`, `this._behaviorInstance`, and the methods on `IInstanceBase` / `IBehaviorInstanceBase` actually return. Understanding them is essential for writing editor instance code that manipulates instances, reads/writes properties programmatically, or works with images and animations.

### Interface hierarchy

```
IObjectClass
  ├── IObjectType           ← most plugins work with this
  │     └── (instances)
  │           ├── IObjectInstance      ← non-world plugins (invisible objects)
  │           └── IWorldInstance       ← world plugins (have canvas presence)
  └── IFamily               ← group of same-plugin object types

IBehaviorInstance           ← editor side of a behavior attached to an object
IContainer                  ← group of object types always created/destroyed/picked together

IAnimationFrame             ← one image/frame (also used for single-image plugins)
  ├── ICollisionPoly        ← collision polygon for a frame (texture coords 0–1)
  └── IImagePoint           ← named point on a frame (texture coords 0–1)
IAnimation                  ← one animation (collection of frames), Sprite-like plugins only

IProject                    ← top-level project model (object types, layouts, files, families)
ILayout                     ← a layout in the project model
ILayer                      ← a layer within a layout (editor model, not runtime)
IEventSheet                 ← an event sheet (name + root event tree)
IProjectFile                ← a file added in the Project Bar

SDK.Rect                    ← axis-aligned rectangle geometry primitive
SDK.Quad                    ← four-point (possibly rotated) rectangle primitive
SDK.Color                   ← floating-point RGBA color (0–1 per channel, premultiplied)

IWebGLRenderer              ← issues draw commands in Draw() (editor Layout View)
IDrawParams                 ← extra context passed alongside IWebGLRenderer in Draw()
ILayoutView                 ← the editor Layout View window (zoom, coord transforms)
```

---

### IObjectClass — base of IObjectType

The lowest common base. Both `IObjectType` and `IFamily` derive from it. Any parameter that accepts `IObjectClass` accepts either.

```js
GetName()      // string — the object type or family name
GetProject()   // IProject — the project this class belongs to
Delete()       // Immediately removes the object class from the project, no undo, no confirmation
               // ⚠ Also removes ALL events referencing it. Use with extreme care.
```

---

### IObjectType — the editor object type

Derives from `IObjectClass`. This is the primary interface for interacting with an object type in editor code. Access it via `GetObjectType()` on any instance.

```js
// --- Image / animation access ---
GetImage()                                        // IAnimationFrame — the object's single image
                                                  // (only if plugin set SetHasImage(true))
EditImage()                                       // Opens the Animations Editor for this object
GetAnimations()                                   // IAnimation[] — all animations (Sprite-like plugins only)
await AddAnimation(animName, blob?, w?, h?)       // Adds a new animation + first frame. Returns IAnimation.
                                                  // blob/w/h optional — omit for empty default frame

// --- Instance access ---
GetAllInstances()                                 // (IObjectInstance | IWorldInstance)[] — all instances
                                                  // across all layouts in the project

// --- World instance creation ---
CreateWorldInstance(layer)                        // IWorldInstance — creates and places a new instance
                                                  // on the given ILayer (world-type plugins only)

// --- Container membership ---
IsInContainer()                                   // boolean
GetContainer()                                    // IContainer | null
CreateContainer(objectTypesArray)                 // Creates a new container. Array must include this
                                                  // type, must have ≥ 2 members, must not already
                                                  // be in a container. Returns IContainer.
```

> **`GetAllInstances()` returns instances across all layouts.** If you need only instances on the current layout, filter by `inst.GetLayout()`.

> **`AddAnimation()` is async** — always `await` it. The returned `IAnimation` already has its first frame; don't add a duplicate frame immediately after.

---

### IObjectInstance — non-world plugin instances (editor)

Represents one placed instance of a non-world (invisible/object-type) plugin in the editor. Access via `this._inst` in `IInstanceBase`.

```js
GetProject()                    // IProject
GetObjectType()                 // IObjectType — the object type this instance belongs to
GetUID()                        // number — the UID the editor assigned to this instance
                                //   stable across saves/loads within a project

// --- Property access (by property ID string) ---
GetPropertyValue(id)            // any — color properties return SDK.Color
SetPropertyValue(id, value)     // void — color properties require SDK.Color

// --- Cross-addon access ---
GetExternalSdkInstance()        // IInstanceBase derivative | null
                                // Returns the custom SDK editor instance class for installed addons.
                                // Returns null for built-in plugins.
                                // ⚠ Only depend on documented, stable APIs of third-party classes.
```

> **Property IDs are the string `id` fields from `config.caw.js` `properties[]`**, not indices. `GetPropertyValue("myText")` is the editor equivalent of the runtime's `_getInitProperties()[0]`.

---

### IWorldInstance — world plugin instances (editor)

Derives from `IObjectInstance`. Adds spatial/visual properties for objects that exist in the layout. Access via `this._inst` in `IWorldInstanceBase` subclasses.

```js
// --- Spatial context ---
GetLayer()                      // ILayer — the layer this instance is on
GetLayout()                     // ILayout — the layout this instance is on
GetBoundingBox()                // SDK.Rect — axis-aligned bounding box in layout coordinates
GetQuad()                       // SDK.Quad — rotated bounding quad in layout coordinates

// --- Color and opacity ---
GetColor()                      // SDK.Color — premultiplied RGBA color (combines tint + opacity)
GetOpacity()                    // number 0–1
SetOpacity(o)                   // number 0–1

// --- Position ---
GetX() / SetX(x)
GetY() / SetY(y)
GetXY()                         // [x, y]
SetXY(x, y)
GetZ() / SetZ(z)                // Z position relative to the layer's Z elevation
GetXYZ()                        // [x, y, z]
SetXYZ(x, y, z)
GetTotalZ()                     // Z + layer's own Z elevation (absolute Z in the scene)

// --- Angle ---
GetAngle() / SetAngle(a)        // radians

// --- Size ---
GetWidth()  / SetWidth(w)       // pixels
GetHeight() / SetHeight(h)      // pixels
SetSize(w, h)
GetDepth()  / SetDepth(d)       // pixels — Z-axis depth; 0 for 2D objects

// --- Origin (normalised 0–1) ---
GetOriginX() / SetOriginX(x)    // 0 = left edge, 0.5 = centre, 1 = right edge
GetOriginY() / SetOriginY(y)
SetOrigin(x, y)

// --- Effects ---
ApplyBlendMode(iRenderer)       // Sets the renderer's blend mode to match this instance's
                                // "Blend mode" property. Only meaningful if plugin uses effects.

// --- Sampling ---
GetSampling()                   // "auto" | "nearest" | "bilinear" | "trilinear"
SetSampling(sampling)
GetActiveSampling()             // The resolved sampling mode — differs from GetSampling() only
                                // when mode is "auto" (inherits from layer/layout/project)
```

> **Angles are in radians**, not degrees. Convert: `degrees * Math.PI / 180`.

> **`GetTotalZ()` vs `GetZ()`** — `GetZ()` is the instance's own Z position. `GetTotalZ()` adds the layer's Z elevation on top. Use `GetTotalZ()` for depth sorting across layers.

> **`GetActiveSampling()` is what actually renders.** Always use this — not `GetSampling()` — when you need to know the real sampling mode being applied.

---

### IBehaviorInstance — editor behavior instance

Represents one behavior attached to one object instance in the editor. Access via `this._behaviorInstance` in `IBehaviorInstanceBase`.

```js
GetProject()                    // IProject
GetObjectInstance()             // IObjectInstance | IWorldInstance (depends on the host object type)

// --- Property access (by property ID string) ---
GetPropertyValue(id)            // any
SetPropertyValue(id, value)     // void

// --- Cross-addon access ---
GetExternalSdkInstance()        // IBehaviorInstanceBase derivative | null
                                // Returns the SDK editor instance for installed behavior addons.
                                // Returns null for built-in behaviors.
                                // ⚠ Only depend on documented, stable APIs of third-party classes.
```

---

### IAnimationFrame — a single image or animation frame

Used both for single-image plugins (Tiled Background, etc.) and individual frames inside an `IAnimation`. Despite the name, it is the universal image container in the editor SDK.

```js
// --- Image metadata ---
GetObjectType()                 // IObjectType
GetWidth()  / GetHeight()       // number — pixel dimensions of this frame's image

// --- Texture (for Draw() in IWorldInstanceBase) ---
GetCachedWebGLTexture()         // IWebGLTexture | null — null while not yet loaded
GetTexRect()                    // SDK.Rect — UV coordinates of this image on the texture atlas
                                // ⚠ Always use this, never assume 0,0,1,1 — C3 spritesheets images
async LoadWebGLTexture()        // Starts async load. Returns IWebGLTexture when resolved.
                                // Only call this if GetCachedWebGLTexture() returned null.

// --- Raw image data ---
GetBlob()                       // Blob — compressed PNG/WebP/AVIF of the current image
await ReplaceBlobAndDecode(blob) // Replaces the frame's image content with the given Blob.
                                 // Decodes it, updates size, returns Promise<void>.

// --- Per-frame playback settings ---
GetDuration() / SetDuration(d)  // number — frame duration multiplier (1 = normal, 2 = twice as long)

// --- Origin (texture co-ordinates 0–1) ---
GetOriginX() / SetOriginX(x)    // 0.5 = centre (default)
GetOriginY() / SetOriginY(y)

// --- Image points ---
GetImagePoints()                // IImagePoint[] — all image points on this frame
AddImagePoint(name, x, y)       // Adds a named image point (texture co-ords 0–1). Returns IImagePoint.

// --- Collision polygon ---
GetCollisionPoly()              // ICollisionPoly — the editor-side collision polygon for this frame
                                // Points are in texture co-ordinates (0–1). See ICollisionPoly below.

// --- Lifecycle ---
Delete()                        // Removes this frame. ⚠ Cannot delete the last frame. No undo.
```

> **`IAnimationFrame` is not directly renderable.** Pass it to `IWorldInstanceBase.GetTexture(frame)` — that method handles the async load and returns `null` while loading, then `IWebGLTexture` once ready. Only call `LoadWebGLTexture()` directly if you are building custom image loading logic.

> **`ReplaceBlobAndDecode()` can change the frame's pixel dimensions** — re-query `GetWidth()` / `GetHeight()` after awaiting it.

---

### ICollisionPoly — the collision polygon for an animation frame (editor)

Returned by `IAnimationFrame.GetCollisionPoly()`. Represents the collision shape attached to one image frame in the editor. Points are stored in **texture co-ordinates (0–1)**, not pixel coordinates — the same coordinate space as origin and image points.

```js
// --- Read the polygon ---
IsDefault()          // boolean — true if the polygon has not been customised (matches bounding box)
GetPoints()          // number[] — flat array of alternating [x0, y0, x1, y1, ...] in texture coords (0–1)
                     // Always even length. Always at least 6 elements (≥ 3 points).

// --- Write the polygon ---
Reset()              // Resets polygon to the default bounding-box shape
SetPoints(arr)       // Replaces the polygon. arr must be flat [x0, y0, x1, y1, ...],
                     // even length, ≥ 6 elements (≥ 3 points).
```

#### Converting between texture coords and pixel coords

```js
const poly = frame.GetCollisionPoly();
const pts  = poly.GetPoints();  // [x0, y0, x1, y1, ...]
const fw   = frame.GetWidth();
const fh   = frame.GetHeight();

// Texture (0–1) → pixels
for (let i = 0; i < pts.length; i += 2) {
  const px = pts[i]     * fw;
  const py = pts[i + 1] * fh;
}

// Pixels → texture (0–1) for SetPoints()
const texPts = rawPixelPts.map((v, i) => i % 2 === 0 ? v / fw : v / fh);
poly.SetPoints(texPts);
```

#### Programmatically setting a custom polygon

```js
// Triangle covering the top half of the image
frame.GetCollisionPoly().SetPoints([
  0.0, 0.0,   // top-left
  1.0, 0.0,   // top-right
  0.5, 0.5,   // mid-centre
]);
```

> **Coordinate space is texture coords, not layout pixels.** This is the editor-side interface. The runtime equivalent (reading poly points from `inst.animation.currentFrame`) uses the same 0–1 space — see Section 17 for the runtime-to-world-space conversion pattern.

> **`SetPoints()` minimum requirement: 6 elements (3 points).** Passing fewer will error. Always validate the array before calling it.

> **`IsDefault()` is the safe check before `GetPoints()`.** If you only want to read the polygon when it has been explicitly customised, gate on `!poly.IsDefault()` first.

---

### IAnimation — an animation within a Sprite-like plugin

Only applicable to animated plugin types (e.g. Sprite). Obtained from `IObjectType.GetAnimations()` or `IObjectType.AddAnimation()`.

```js
GetName()                       // string — animation name
GetObjectType()                 // IObjectType

// --- Frames ---
GetFrames()                     // IAnimationFrame[] — all frames in order
await AddFrame(blob?, w?, h?)   // Adds a frame. All params optional:
                                //   no args → empty default-size frame
                                //   blob only → decodes blob to determine size
                                //   blob + w + h → uses provided size (faster, skips decode)
                                //   no blob + w + h → empty frame at given size
                                // Returns Promise<IAnimationFrame>

// --- Playback settings ---
GetSpeed()   / SetSpeed(s)      // number — frames per second
IsLooping()  / SetLooping(l)    // boolean — whether the animation loops
IsPingPong() / SetPingPong(p)   // boolean — alternates forward/backward playback
GetRepeatCount() / SetRepeatCount(r)  // number — how many times to repeat
GetRepeatTo()    / SetRepeatTo(f)     // number — frame index to jump back to on repeat
                                      //   must be a valid frame index

// --- Lifecycle ---
Delete()                        // Removes this animation. ⚠ Cannot delete the last animation. No undo.
```

> **`AddFrame()` is async** — always `await` it before working with the returned `IAnimationFrame`.

> **`SetRepeatTo()` must receive a valid frame index.** If you set it to a value beyond the current frame count and then reduce frame count, Construct may error. Always validate the index first.

---

### Quick reference: what `this._inst` returns

| Context | `this._inst` type |
|---|---|
| Non-world plugin `IInstanceBase` | `IObjectInstance` |
| World plugin `IWorldInstanceBase` | `IWorldInstance` |
| Behavior `IBehaviorInstanceBase` | `IBehaviorInstance` (via `this._behaviorInstance`) |

### Quick reference: how to read/write a property from editor code

```js
// In IInstanceBase or IWorldInstanceBase subclass:
OnPropertyChanged(id, value) {
  // id = the property's string ID from config.caw.js
  // value = the new value (SDK.Color for color properties)
}

// Reading any property programmatically:
const val = this._inst.GetPropertyValue("myText");

// Writing a property (e.g. to apply a default on first placement):
OnPlacedInLayout() {
  this._inst.SetPropertyValue("myNumber", 42);
}

// In IBehaviorInstanceBase subclass:
OnAddedInEditor() {
  this._behaviorInstance.SetPropertyValue("speed", 200);
}
```

---

## 21. Model Interfaces

The **model interfaces** represent the project structure in the editor — layouts, layers, event sheets, and project files. They are available from editor instance code via `GetProject()` on any instance or behavior interface.

---

### IProject — the top-level project model

The root of everything in the editor SDK. Available from `GetProject()` on any `IObjectInstance`, `IBehaviorInstance`, or via `IInstanceBase.GetProject()`.

```js
// --- Identity ---
GetName()                                    // string — the project name

// --- Object type / family lookup (all case-insensitive) ---
GetObjectTypeByName(name)                    // IObjectType | null
GetFamilyByName(name)                        // IFamily | null
GetObjectClassByName(name)                   // IObjectType | IFamily | null
GetObjectClassBySID(sid)                     // IObjectType | IFamily | null
                                             // ⚠ "object" type properties store SIDs — use this
                                             // to resolve the corresponding object class in editor code

// --- Special built-ins ---
GetSystemType()                              // IObjectType — the System plugin (always exists)
GetSingleGlobalObjectType(pluginId)          // IObjectType | null — resolves an IsSingleGlobal plugin
                                             // Returns null if not found, not single-global, or not added

// --- Creating objects and families ---
await CreateObjectType(pluginId, name)       // IObjectType — adds a new object type to the project
                                             // Name may be adjusted if already taken; always call
                                             // GetName() on the result to find the actual name used
CreateFamily(name, memberObjectTypesArray)   // IFamily — creates a family with ≥1 member
                                             // All members must use the same plugin
                                             // Pass null for name to use a default

// --- Instance lookup ---
GetInstanceByUID(uid)                        // IObjectInstance | IWorldInstance | null

// --- Project files ---
GetProjectFileByName(name)                   // IProjectFile | null — case-insensitive filename match
GetProjectFileByExportPath(path)             // IProjectFile | null
                                             // Path depends on Export file structure setting:
                                             //   "Flat" mode: all files at root, case-insensitive
                                             //   "Folders" mode: mirrors Project Bar subfolders, case-sensitive
GetProjectFileBySID(sid)                     // IProjectFile | null
                                             // ⚠ "projectfile" type properties store SIDs — use this
                                             // to resolve the corresponding file in editor code

AddOrReplaceProjectFile(blob, filePath, kind?)
                                             // Creates or replaces a file in the project.
                                             // filePath may include subfolders: "myfolder/myfile.txt"
                                             // kind defaults to "general" → appears in "Files" folder
                                             // Other kinds: "sound", "music", "video", "font", "icon"
                                             // Set blob.type for correct MIME (e.g. "text/plain")

ShowImportAudioDialog(fileList)              // Opens the Import audio dialog for a list of Blob/File
                                             // Prefer PCM WAV input — transcoded to WebM Opus automatically
                                             // Blobs from IZipFile already have a .name property

EnsureFontLoaded(fontName)                   // Ensures a font is loaded before text rendering plugins draw

// --- Undo support ---
UndoPointChangeObjectInstancesProperty(instances, propertyId)
                                             // Call BEFORE changing an instance property to make it undoable
                                             // instances: IObjectInstance or IObjectInstance[]
```

> **`CreateObjectType()` is async** — always `await` it. The `name` parameter is a request; if already taken, Construct picks a unique name. Always call `GetName()` on the returned `IObjectType` to confirm.

> **`GetObjectClassBySID()` is the correct way to resolve "object"-type properties.** These properties store a SID, not a name. Attempting `GetObjectTypeByName()` with the property value will fail.

---

### ILayout — a layout in the project model

Returned by `IWorldInstance.GetLayout()`, `ILayerModel.GetLayout()`, or `IProject.GetLayouts()` (if available).

```js
GetProject()      // IProject
GetName()         // string — the layout name
GetAllLayers()    // ILayer[] — all layers on this layout in order
GetEventSheet()   // IEventSheet | null — the event sheet assigned to this layout
                  // Layouts don't require an event sheet, so null is valid
```

> `ILayout` is the **project model** interface. It is separate from the runtime `this.runtime.layout`, which is a different object used at game runtime.

---

### ILayer — a layer in the project model (editor)

Returned by `ILayout.GetAllLayers()` or `IWorldInstance.GetLayer()`.

```js
GetName()         // string — the layer name
GetLayout()       // ILayout — the layout this layer belongs to
```

> This is the **editor model** `ILayer`, not the runtime Layer API described in Section 5. The runtime layer has `isVisible`, `scrollX`, `subLayers()`, etc. — none of those exist here. Use this only in editor-side instance code for things like `CreateWorldInstance(layer)`.

---

### IEventSheet — an event sheet in the project model

Returned by `ILayout.GetEventSheet()`.

```js
GetProject()      // IProject
GetName()         // string — the event sheet name
GetRoot()         // IEventParentRow — root node of the event tree
                  // Events are a nested tree; GetRoot() gives the top-level parent row
```

---

### IProjectFile — a file in the Project Bar

Returned by `IProject.GetProjectFileByName/BySID/ByExportPath()`.

```js
GetName()         // string — the filename (e.g. "config.json")
GetPath()         // string — full export path including subfolders (e.g. "media/music.webm")
                  // "Files" folder items are always at root; no subfolder prefix
GetProject()      // IProject
GetBlob()         // Blob — the raw file contents; use standard web Blob APIs to read
```

> `GetPath()` returns the **export** path, not the Project Bar display path. Use it to match against relative URLs in runtime code.

---

## 22. Geometry Primitives

`SDK.Rect`, `SDK.Quad`, and `SDK.Color` are standalone geometry classes used throughout the editor SDK. They appear as return types from `IWorldInstance`, `IAnimationFrame`, and `IWebGLRenderer` methods, and can be constructed independently for general use.

---

### SDK.Rect — axis-aligned rectangle

```js
// Construction
new SDK.Rect()                           // all sides = 0
new SDK.Rect(left, top, right, bottom)

// Set
rect.set(left, top, right, bottom)
rect.copy(otherRect)                     // copy from another Rect
rect.clone()                             // returns new Rect with same values

// Individual sides (get/set)
rect.setLeft(v) / rect.getLeft()
rect.setTop(v)  / rect.getTop()
rect.setRight(v) / rect.getRight()
rect.setBottom(v) / rect.getBottom()

// Dimensions
rect.width()       // right - left  (can be negative if flipped)
rect.height()      // bottom - top
rect.midX()        // (left + right) / 2
rect.midY()        // (top + bottom) / 2

// Transform
rect.offset(x, y)          // shift all sides
rect.inflate(x, y)         // grow: left-=x, top-=y, right+=x, bottom+=y
rect.deflate(x, y)         // shrink (opposite of inflate)
rect.multiply(x, y)        // scale each side
rect.divide(x, y)
rect.clamp(l, t, r, b)     // constrain each side to given bounds
rect.normalize()           // swap left/right or top/bottom if inverted, ensuring positive size

// Tests
rect.intersectsRect(other)  // boolean
rect.containsPoint(x, y)    // boolean
```

> **`width()` and `height()` can return negative values** if `right < left` or `bottom < top`. Call `normalize()` first if this could happen.

> **`SDK.Rect` uses `getLeft()` / `setLeft()` style accessors** — not `.left` / `.right` properties. The geometry classes use explicit getter/setter methods throughout.

---

### SDK.Quad — four-point (possibly rotated) quad

The main primitive for rendering. Used wherever a rotated bounding box is needed — `IWorldInstance.GetQuad()`, renderer `Quad()` calls, and `setFromRotatedRect()`.

```js
// Construction
new SDK.Quad()
new SDK.Quad(tlx, tly, trx, try_, brx, bry, blx, bly)
// Points: tl=top-left, tr=top-right, br=bottom-right, bl=bottom-left
// Note: try_ (not try — "try" is a reserved JS keyword)

// Set
quad.set(tlx, tly, trx, try_, brx, bry, blx, bly)
quad.setRect(left, top, right, bottom)       // set as unrotated rect
quad.setFromRect(rect)                       // set from SDK.Rect
quad.setFromRotatedRect(rect, angleRadians)  // set as rotated rect around origin
quad.copy(otherQuad)

// Individual point getters/setters
quad.getTlx() / quad.setTlx(n)    // top-left x
quad.getTly() / quad.setTly(n)    // top-left y
quad.getTrx() / quad.setTrx(n)    // top-right x
quad.getTry() / quad.setTry(n)    // top-right y  (getTry, not getTry_)
quad.getBrx() / quad.setBrx(n)    // bottom-right x
quad.getBry() / quad.setBry(n)    // bottom-right y
quad.getBlx() / quad.setBlx(n)    // bottom-left x
quad.getBly() / quad.setBly(n)    // bottom-left y

// Dimensions
quad.midX()                        // average of all four x components
quad.midY()                        // average of all four y components
quad.getBoundingBox(rect)          // writes AABB into an existing SDK.Rect (avoids allocation)

// Tests
quad.intersectsSegment(x1, y1, x2, y2)   // boolean — segment vs quad
quad.intersectsQuad(other)               // boolean — quad vs quad
quad.containsPoint(x, y)                 // boolean
```

> **`try_` in the constructor** — the top-right Y parameter is named `try_` (with underscore) to avoid the JS `try` keyword. The getter is `getTry()` (no underscore).

> **`getBoundingBox(rect)` writes to a passed rect** — pass a pre-allocated `SDK.Rect` to avoid garbage. `const bb = new SDK.Rect(); quad.getBoundingBox(bb);`

---

### SDK.Color — floating-point RGBA color

All components are in the `[0, 1]` range. The WebGL renderer uses **premultiplied alpha** — `RGB` components are multiplied by `A`. Always check whether an API returns premultiplied or straight alpha.

```js
// Construction
new SDK.Color()                    // all components = 0
new SDK.Color(r, g, b, a)

// Set
color.setRgb(r, g, b)             // set RGB only, alpha unchanged
color.setRgba(r, g, b, a)
color.copy(other)                  // copy RGBA from another Color
color.copyRgb(other)               // copy RGB only
color.clone()                      // returns new Color

// Individual components (get/set) — all floats in [0, 1]
color.setR(v) / color.getR()
color.setG(v) / color.getG()
color.setB(v) / color.getB()
color.setA(v) / color.getA()

// Comparison
color.equals(other)                // boolean — exact RGBA match
color.equalsIgnoringAlpha(other)   // boolean — RGB only
color.equalsRgb(r, g, b)
color.equalsRgba(r, g, b, a)

// Alpha premultiplication
color.premultiply()                // RGB *= A  (required before passing to renderer)
color.unpremultiply()              // RGB /= A  ⚠ LOSSY — avoid when possible
```

> **Premultiplied alpha is required for the renderer.** `IWorldInstance.GetColor()` returns a premultiplied color. If you construct a color manually and want to render it, call `color.premultiply()` first.

> **`unpremultiply()` is lossy.** Dividing back loses precision if A < 1. Only use it when you genuinely need straight-alpha values (e.g. writing back to image data).

---

## 23. Graphics Interfaces

These interfaces are only available inside a `Draw(iRenderer, iDrawParams)` call in `IWorldInstanceBase`. They cannot be constructed directly.

---

### IWebGLRenderer — draw commands for the editor Layout View

The renderer uses a **persistent state model** — you must set all intended state before drawing. The four state components are: blend mode, fill mode, color, and texture. Setting state that hasn't changed is efficiently discarded.

#### Blend mode

```js
iRenderer.SetAlphaBlendMode()           // premultiplied alpha blend (most common)
iRenderer.SetBlendMode(string)          // "normal" | "additive" | "copy" | "destination-over" |
                                        // "source-in" | "destination-in" | "source-out" |
                                        // "destination-out" | "source-atop" | "destination-atop" |
                                        // "lighten" | "darken" | "multiply" | "screen"
                                        // "normal" == SetAlphaBlendMode()
```

#### Fill mode

```js
iRenderer.SetColorFillMode()            // draw solid color (uses current color)
iRenderer.SetTextureFillMode()          // draw texture (uses current texture; alpha = opacity)
iRenderer.SetSmoothLineFillMode()       // draw anti-aliased lines (uses current color)
```

#### Color and texture

```js
iRenderer.SetColor(sdkColor)            // set color with SDK.Color
iRenderer.SetColorRgba(r, g, b, a)      // set color directly
iRenderer.SetOpacity(o)                 // set alpha component only (0–1)
iRenderer.ResetColor()                  // reset to (1, 1, 1, 1)
iRenderer.SetCurrentZ(z)               // Z for subsequent 2D draw calls
iRenderer.GetCurrentZ()

iRenderer.SetTexture(texture, sampling?)
// sampling: "auto" (default, uses texture's defaultSampling) | "nearest" | "bilinear" | "trilinear"
```

#### Draw primitives

```js
// Rects and quads (2D)
iRenderer.Rect(sdkRect)
iRenderer.Rect2(left, top, right, bottom)
iRenderer.Quad(sdkQuad)
iRenderer.Quad2(tlx, tly, trx, try_, brx, bry, blx, bly)
iRenderer.Quad3(sdkQuad, texRectSrc)         // quad + texture UV from SDK.Rect
iRenderer.Quad4(sdkQuad, texQuadSrc)         // quad + texture UV from SDK.Quad

// 3D quads
iRenderer.Quad3D(tlx,tly,tlz, trx,try_,trz, brx,bry,brz, blx,bly,blz, texRect)
iRenderer.Quad3D2(tlx,tly,tlz, trx,try_,trz, brx,bry,brz, blx,bly,blz, texQuad)

// Mesh
iRenderer.DrawMesh(posArr, uvArr, indexArr, colorArr?)
// posArr: flat [x0,y0,z0, x1,y1,z1, ...], uvArr: flat [u0,v0, u1,v1, ...],
// indexArr: triangle indices. colorArr is optional per-vertex color.

// Convex polygon
iRenderer.ConvexPoly(pointsArray)        // flat [x0,y0, x1,y1, ...], ≥3 points (≥6 elements)
```

#### Lines

```js
iRenderer.Line(x1, y1, x2, y2)
iRenderer.TexturedLine(x1, y1, x2, y2, uStart, uEnd)
iRenderer.LineRect(left, top, right, bottom)
iRenderer.LineRect2(sdkRect)
iRenderer.LineQuad(sdkQuad)

iRenderer.PushLineWidth(w)    // must be paired with PopLineWidth()
iRenderer.PopLineWidth()
iRenderer.PushLineCap(cap)    // "butt" | "square" — must be paired with PopLineCap()
iRenderer.PopLineCap()
```

#### Dynamic textures

```js
// Create a texture you manage yourself (not loaded from an animation frame)
const tex = iRenderer.CreateDynamicTexture(width, height, {
  wrapX: "clamp-to-edge",      // "clamp-to-edge" | "repeat" | "mirror-repeat"
  wrapY: "clamp-to-edge",
  defaultSampling: "trilinear", // "nearest" | "bilinear" | "trilinear"
  pixelFormat: "rgba8",        // "rgba8" | "rgb8" | "rgba4" | "rgb5_a1" | "rgb565"
  mipMap: true,
  mipMapQuality: "default",    // "default" | "low" | "high"
});

// Upload new pixel data to a dynamic texture (size must match creation size)
iRenderer.UpdateTexture(data, tex, { premultiplyAlpha: true });
// data: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas | ImageData
// In worker mode: only ImageBitmap / OffscreenCanvas / ImageData (no DOM types)

// Release GPU resources when done
iRenderer.DeleteTexture(tex);   // only for textures YOU created — never for engine-managed textures
```

#### Text

```js
const webGLText = iRenderer.CreateWebGLText();
// IWebGLText — manages text layout, wrapping, and upload to a WebGL texture
// Use EnsureFontLoaded() on IProject before rendering fonts
```

#### Standard `Draw()` pattern

```js
Draw(iRenderer, iDrawParams) {
  // 1. Set blend mode
  iRenderer.SetAlphaBlendMode();

  const texture = this.GetTexture(this._inst.GetImage());

  if (texture === null) {
    // Loading / error placeholder
    iRenderer.SetColorFillMode();
    iRenderer.SetColorRgba(0.5, 0.5, 0.5, 0.3);
    iRenderer.Rect(this._inst.GetBoundingBox());
    return;
  }

  // 2. Set fill mode + texture
  iRenderer.SetTextureFillMode();
  iRenderer.SetTexture(texture);
  iRenderer.ResetColor();   // full opacity white tint

  // 3. Draw using bounding quad + correct UV rect from spritesheets
  iRenderer.Quad3(this._inst.GetQuad(), this.GetTexRect());
}
```

> **Always call `iRenderer.Quad3(quad, texRect)` with `GetTexRect()`** — never hardcode `Rect(0, 0, 1, 1)` as the texture UV source. Construct spritesheets images onto atlases; the correct sub-region comes from `GetTexRect()`.

> **`try_` in `Quad2` / `Quad3D`** — top-right Y is always `try_` (with underscore) in the SDK, including here.

> **Dynamic textures must not be resized.** If width/height needs to change, delete and re-create the texture. `UpdateTexture()` requires the data to exactly match the creation dimensions.

---

### IDrawParams — extra context in Draw()

Passed alongside `iRenderer` in every `Draw(iRenderer, iDrawParams)` call.

```js
iDrawParams.GetDt()            // delta-time in seconds (≈1/60)
                               // Only valid when Layout View is continuously animating
                               // (e.g. user dragging near edge). Otherwise a dummy non-zero value.

iDrawParams.GetLayoutView()    // ILayoutView — the editor window being drawn
```

---

### ILayoutView — the editor Layout View window

Returned by `iDrawParams.GetLayoutView()` or `IProject`-adjacent accessors.

```js
iLayoutView.GetProject()       // IProject
iLayoutView.GetLayout()        // ILayout — project model for the layout being shown
iLayoutView.GetActiveLayer()   // ILayer — the currently selected layer in this view
iLayoutView.GetZoomFactor()    // number — e.g. 1.0 = 100%, 0.5 = 50%

// Coordinate conversion (layout space ↔ device pixel space)
iLayoutView.LayoutToClientDeviceX(x)   // layout px → device canvas px
iLayoutView.LayoutToClientDeviceY(y)

// Renderer transform switching
iLayoutView.SetDeviceTransform(iRenderer)   // switch renderer to device pixel coords
                                            // (useful for drawing at screen-pixel sharpness)
iLayoutView.SetDefaultTransform(iRenderer)  // restore layout coordinate transform
                                            // ⚠ Always restore after SetDeviceTransform()

iLayoutView.Refresh()          // schedule a redraw at next animation frame
                               // ⚠ Avoid calling on a timer — wastes battery/CPU
```

> **`SetDeviceTransform` must always be paired with `SetDefaultTransform`** to restore the layout coordinate system after custom rendering.

---

## 24. Remaining Object Interfaces

These fill out the object interface set introduced in Section 20.

---

### IImagePoint — a named point on an animation frame

Returned by `IAnimationFrame.GetImagePoints()` or `IAnimationFrame.AddImagePoint()`. Positions are in **texture co-ordinates (0–1)**, same as origin and collision polygon points.

```js
GetAnimationFrame()      // IAnimationFrame — the frame this point belongs to

GetName()  / SetName(n)  // string — name of this image point (e.g. "gun_barrel")
GetX()     / SetX(x)     // number 0–1 — horizontal position in texture coords
GetY()     / SetY(y)     // number 0–1 — vertical position in texture coords
```

#### Converting texture coords to pixels

```js
const pt = frame.GetImagePoints()[0];
const px = pt.GetX() * frame.GetWidth();
const py = pt.GetY() * frame.GetHeight();
```

#### Adding a named image point

```js
// Add a point at the top-centre of the image
frame.AddImagePoint("tip", 0.5, 0.0);
```

---

### IContainer — a group of object types always linked together

Returned by `IObjectType.GetContainer()` or `IObjectType.CreateContainer()`.

```js
GetMembers()                    // IObjectType[] — always ≥2 members while active

GetSelectMode()                 // "normal" | "all" | "wrap"
SetSelectMode(mode)             // sets the "Select mode" property visible in Construct

RemoveObjectType(objectType)    // removes one member
                                // ⚠ Removing the second-to-last member deactivates
                                // the container — it becomes inactive with one member left

IsActive()                      // boolean — false if fewer than 2 members remain
                                // An inactive container is effectively deleted
```

> **Container minimum:** two members are required to stay active. After `RemoveObjectType()` leaves only one member, `IsActive()` returns `false` and that last object type behaves as if it was never in a container.

---

### IFamily — a group of same-plugin object types

Returned by `IProject.GetFamilyByName()` or `IProject.CreateFamily()`. Derives from `IObjectClass` (so `GetName()`, `GetProject()`, `Delete()` all apply).

```js
GetMembers()                    // IObjectType[] — all object types in the family

SetMembers(objectTypesArray)    // Replace the entire member list.
                                // ⚠ All new members must:
                                //   - use the same plugin as the existing members
                                //   - not have naming conflicts in instance vars,
                                //     behaviors, or effects
```

> **Families must be homogeneous** — all members must use the same plugin (e.g. all Sprites, all Tiled Backgrounds). `SetMembers()` enforces this.

> **`IFamily` inherits `Delete()` from `IObjectClass`** — calling it removes the family from the project, removes all events referencing it, and cannot be undone. Use with care.

---

## 25. Physics Behavior API (IPhysicsBehavior / IPhysicsBehaviorInstance)

The Physics behavior exposes two interfaces: `IPhysicsBehavior` for global world settings, and `IPhysicsBehaviorInstance` for per-object physics control. Access the behavior instance through `inst.behaviors.Physics` on any `IWorldInstance` that has the Physics behavior attached.

### Accessing the Physics interfaces

```js
// From a plugin — inst is an IWorldInstance
const physInst = inst.behaviors.Physics;          // IPhysicsBehaviorInstance
const physWorld = physInst.behavior;              // IPhysicsBehavior (world settings)

// From a behavior — this.instance is the attached IWorldInstance
const physInst = this.instance.behaviors.Physics;
const physWorld = physInst.behavior;

// Change world gravity
physWorld.worldGravity = 0;  // zero-G
```

---

### IPhysicsBehavior — world settings

Accessed via `behaviorInstance.behavior`. Controls the global physics simulation.

```js
behavior.worldGravity          // number — get/set gravity force (default 10, downward)
behavior.steppingMode          // string — get/set: "fixed" or "variable"
                               //   "variable": uses delta-time, framerate independent but non-deterministic
                               //   "fixed": same step every frame, deterministic but may run
                               //   too fast/slow on different refresh rates
behavior.velocityIterations    // number — get/set (default 8). Higher = more accurate, slower
behavior.positionIterations    // number — get/set (default 3). Higher = more accurate, slower
```

#### Collision filtering between object types

```js
behavior.setCollisionsEnabled(iObjectClassA, iObjectClassB, state)
// iObjectClassA, iObjectClassB: IObjectClass references (from runtime.objects.MyType)
// state: boolean — true to enable collisions, false to disable
// Affects ALL instances of the given types
```

---

### IPhysicsBehaviorInstance — per-object physics

Accessed via `inst.behaviors.Physics`.

#### Enable / disable

```js
physInst.isEnabled             // boolean — get/set. When false, the physics body is destroyed
                               // and the behavior has no effect
```

#### Forces

Applying a force causes continuous acceleration in the direction of the force.

```js
physInst.applyForce(fx, fy, imgPt?)                  // custom X/Y components
physInst.applyForceTowardPosition(f, px, py, imgPt?) // toward layout position
physInst.applyForceAtAngle(f, a, imgPt?)             // at angle (radians)
```

> **`imgPt` parameter (all force/impulse/torque methods):**
> - `0` (default) — center of mass (no rotation)
> - `-1` — object origin (may differ from center of mass, causes rotation)
> - `"pointName"` — named image point (causes rotation)

#### Impulses

Applying an impulse simulates a sudden strike (e.g. hit by a bat).

```js
physInst.applyImpulse(ix, iy, imgPt?)
physInst.applyImpulseTowardPosition(i, px, py, imgPt?)
physInst.applyImpulseAtAngle(i, a, imgPt?)
```

#### Torque

```js
physInst.applyTorque(m)                // direct rotational acceleration (radians)
physInst.applyTorqueToAngle(m, a)      // toward angle (radians)
physInst.applyTorqueToPosition(m, px, py)  // toward layout position
```

#### Velocity

```js
physInst.setVelocity(vx, vy)           // set velocity (px/s for X and Y)
physInst.getVelocityX()                // number — current X velocity (px/s)
physInst.getVelocityY()                // number — current Y velocity (px/s)
physInst.getVelocity()                 // [x, y] — both components
physInst.angularVelocity               // number — get/set angular velocity (radians/s)
```

#### Teleport

```js
physInst.teleport(x, y)
// Repositions the object WITHOUT altering its Physics velocity.
// Normal position changes (inst.x = ...) reposition but also alter velocity
// to keep the simulation realistic. Use teleport() for portals, respawns, etc.
```

#### Physics properties

All are getters and setters.

```js
physInst.isImmovable           // boolean — if true, object is static (infinite mass)
physInst.isPreventRotation     // boolean — locks rotation
physInst.density               // number — affects mass calculation
physInst.friction              // number — surface friction
physInst.elasticity            // number — bounciness (0 = no bounce, 1 = full)
physInst.linearDamping         // number — slows linear movement over time
physInst.angularDamping        // number — slows rotation over time
physInst.isBullet              // boolean — enables continuous collision detection
                               //   (prevents fast objects tunneling through thin walls)
```

#### Mass and center of mass (read-only)

```js
physInst.mass                  // number — area of collision mask × density (read-only)
physInst.getCenterOfMassX()    // number — X position of center of mass
physInst.getCenterOfMassY()    // number — Y position of center of mass
physInst.getCenterOfMass()     // [x, y]
```

#### Sleep / wake state

```js
physInst.isAwake               // boolean — get/set. Sleeping objects skip simulation to save CPU.
                               //   Set to true to force a sleeping object to resume simulation
                               //   (e.g. after repositioning an adjacent object).
physInst.isSleeping            // DEPRECATED — returns true when isAwake is false. Use isAwake.
```

#### Joints

All joint methods require `iOtherInst` to be an `IWorldInstance` with the Physics behavior.

```js
// Distance joint — fixed distance, like a rigid pole
physInst.createDistanceJoint(imgPt, iOtherInst, otherImgPt, damping, freq)
// damping: 0–1 damping ratio, freq: mass-spring-damper frequency in Hz

// Revolute joint — free rotation like a pin/hinge
physInst.createRevoluteJoint(imgPt, iOtherInst)
physInst.createLimitedRevoluteJoint(imgPt, iOtherInst, lower, upper)
// lower/upper: rotation limits in radians (like a bell clapper)

// Prismatic joint — movement restricted to one axis
physInst.createPrismaticJoint(
  imgPt, iOtherInst, axisAngle,        // axisAngle in radians
  enableLimit, lowerTranslation, upperTranslation,  // translation limits in px
  enableMotor, motorSpeed, maxMotorForce            // motor in radians/s
)

// Remove all joints (affects connected objects too)
physInst.removeAllJoints()
```

> **After `removeAllJoints()`**, some joints auto-disable collisions between connected objects. You may need to manually disable collisions again to prevent overlapping objects from "teleporting" apart.

> **Image point 0 = center of mass** for all joint methods. Use `-1` for the object origin.

#### Contacts

```js
physInst.getContactCount()             // number — how many contact points exist
physInst.getContactX(index)            // number — X position of contact (layout coords)
physInst.getContactY(index)            // number — Y position of contact (layout coords)
physInst.getContact(index)             // [x, y]
```

#### Collision filter

```js
physInst.setCollisionFilter(isInclusive, tags)
// isInclusive: boolean — true = inclusive mode, false = exclusive mode
// tags: string (space-separated) or iterable of strings (array, Set)
```

---

### Physics usage patterns

#### Accessing Physics from another behavior

```js
// In a behavior's _tick() or ACE method:
const phys = this.instance.behaviors.Physics;
if (phys) {
  phys.setVelocity(200, -300);
  phys.applyForceAtAngle(500, Math.PI / 4);  // 45° force
}
```

#### Zero-gravity space game

```js
// Set once, affects all Physics objects
const phys = spriteInst.behaviors.Physics;
phys.behavior.worldGravity = 0;

// Thrust forward at the ship's current angle
phys.applyForceAtAngle(thrustPower, spriteInst.angle);
```

#### Teleport through a portal

```js
// Preserve velocity when repositioning
const phys = playerInst.behaviors.Physics;
phys.teleport(portalExitX, portalExitY);
```

#### Waking a sleeping object

```js
// After repositioning a platform, wake nearby physics objects
for (const inst of runtime.objects.Crate.getAllInstances()) {
  const phys = inst.behaviors.Physics;
  if (phys && !phys.isAwake) {
    phys.isAwake = true;
  }
}
```

---

## 26. ISDKBehaviorInstanceBase — Runtime Behavior API

`ISDKBehaviorInstanceBase` is the runtime base class for behavior instances in the addon SDK. It derives from the C3 internal `IBehaviorInstance`. All methods below are available on `this` inside `src/runtime/instance.js` for behavior addons.

---

### Lifecycle overrides

All are optional. Define them as methods on the class returned by `instance.js`.

```js
// Called during instance construction. Called before the associated object instance
// is fully ready. Only use for pure data initialization.
constructor() { super(); }

// Called after the associated object instance has fully finished being created.
// this.instance is valid here. Use for sibling behavior lookup, first-time setup.
_postCreate() {}

// Called each tick just BEFORE events are run (when _setTicking(true) is active).
_tick() {}

// Called each tick just AFTER events are run (when _setTicking2(true) is active).
_tick2() {}

// Called after ALL other behaviors have had their _tick() called.
// Use for observing final state of sibling behaviors.
// Prefer _tick() when possible — post-tick order is not guaranteed.
_postTick() {}

// Called when the instance is destroyed. Must call super._release().
_release() { super._release(); }

// Return a plain JSON object for savegames.
_saveToJson() { return {}; }

// Restore state from a prior _saveToJson() result.
_loadFromJson(o) {}

// Return debugger sections. See Section 12 for format.
_getDebuggerProperties() { return []; }
```

---

### Property initialization

```js
this._getInitProperties()
// Call in constructor. Returns flat array of initial property values.
// Index order matches config.caw.js properties[] declaration order.
```

---

### Ticking utilities

| Method | Description |
|---|---|
| `this._setTicking(bool)` | Enable/disable `_tick()` (before events) |
| `this._setTicking2(bool)` | Enable/disable `_tick2()` (after events) |
| `this._setPostTicking(bool)` | Enable/disable `_postTick()` (after all ticks) |
| `this._isTicking()` | Returns whether `_tick()` is currently active |
| `this._isTicking2()` | Returns whether `_tick2()` is currently active |
| `this._isPostTicking()` | Returns whether `_postTick()` is currently active |

> **Calls do not stack.** Three calls to `_setTicking(true)` + one to `_setTicking(false)` = ticking is off. Redundant calls are safely ignored.

> **Stop ticking when idle** to minimize per-frame overhead. Re-enable on demand.

---

### Triggering conditions

```js
// Synchronous fire — most common
this._trigger(C3.Behaviors["addon_id"].Cnds.MyTrigger);

// Async fire — returns Promise that resolves when the trigger finishes executing.
// Useful for C3 debugger support (breakpoints inside triggers wait for resolution).
await this._triggerAsync(C3.Behaviors["addon_id"].Cnds.MyTrigger);
```

In CAW, the generated `_trigger(methodName)` helper (see §10) wraps the above automatically — prefer `this._trigger("MethodName")` over calling `super._trigger(...)` directly.

---

### Full behavior instance template

```js
export default function (parentClass) {
  return class extends parentClass {

    constructor() {
      super();
      // ✓ Safe: primitives, Maps, arrays, _getInitProperties()
      // ✗ Never access this.instance here — it is null
      this._setTicking(true);
      const props = this._getInitProperties();
      // props[0], props[1], ... match config.caw.js properties[] order
    }

    _postCreate() {
      // this.instance is fully available here
      // Good for sibling behavior lookup
      this._phys = this.instance.behaviors["Physics"] ?? null;
    }

    _tick() {
      const dt = this.instance.runtime.dt;  // seconds
      // main per-frame logic
    }

    _tick2() {
      // runs after the event sheet — react to event-driven state changes
    }

    _postTick() {
      // runs after all _tick() calls — observe other behaviors' final state
    }

    _release() {
      super._release();  // always required
    }

    _saveToJson() {
      return { myValue: this._myValue };
    }

    _loadFromJson(o) {
      this._myValue = o.myValue ?? 0;
    }

    _getDebuggerProperties() {
      return [{
        title: `$${this.behaviorType.name}`,
        properties: [
          { name: "$State", value: this._myValue },
        ],
      }];
    }
  };
}
```

---

### Lifecycle call order summary

| Order | Method | `this.instance` ready | When |
|---|---|---|---|
| 1 | `constructor()` | ✗ no | Instance being built |
| 2 | `_postCreate()` | ✓ yes | Immediately after instance is fully created |
| 3 | `_tick()` | ✓ yes | Every frame, before events |
| 4 | `_tick2()` | ✓ yes | Every frame, after events |
| 5 | `_postTick()` | ✓ yes | Every frame, after all `_tick()` calls |
| — | `_release()` | ✓ yes | Instance being destroyed |

---

### Gotchas

- **`this.instance` is `null` in `constructor()`** — never read `.x`, `.behaviors`, or any instance property there. Use `_postCreate()` or a lazy-init guard in `_tick()`.
- **Prefer `_postCreate()` over a lazy-init flag in `_tick()`** when you only need to run setup once right after creation — it is cleaner and runs exactly once.
- **`_tick2()` and `_postTick()` are disabled by default** — you must call `_setTicking2(true)` / `_setPostTicking(true)` in the constructor to activate them.
- **`_triggerAsync()` is for debugger-aware triggers.** For normal triggers, `_trigger()` (synchronous) is always sufficient and simpler.
- **`_release()` must call `super._release()`** or engine resources will not be cleaned up.

### The `expose` flag — what it does

When an ACE file has `export const expose = true`, CAW copies the ACE's default export function onto the **runtime instance prototype** under the ACE method name. This is the mechanism that makes methods callable from C3 scripts.

```js
// a.SetMaxSpeed.js
export const expose = true;

export default function (speed) {
  this.setMaxSpeed(speed);   // delegates to public method
}
```

With `expose: true` the user can call:

```js
// In a C3 Script event:
const beh = playerInst.behaviors.PlatformerPhysics;
beh.setMaxSpeed(300);   // ✓ — works because expose: true and method exists on prototype
```

With `expose: false`, the function exists only as the ACE handler and is not accessible from script.

---

### Design pattern — public methods as the single source of truth

The recommended pattern is to extract all logic into **named public methods** on the instance, then have every ACE's default export call the corresponding method. This means:

- Event sheet actions and script calls share exactly the same code path
- The public method IS the scripting API
- Behavior logic is testable without the C3 event sheet

```js
// ✗ WRONG — inline logic not reachable from scripts unless ACE expose:true is enough
export default function (speed) {
  this._maxSpeed = Math.max(0, speed);  // logic lives only in the ACE
}

// ✓ CORRECT — logic in public method, ACE just delegates
// In instance.js:
setMaxSpeed(speed) {
  this._maxSpeed = Math.max(0, speed);
}

// In a.SetMaxSpeed.js:
export const expose = true;
export default function (speed) { this.setMaxSpeed(speed); }
```

---

### Naming conventions

| Method type | Convention | Example |
|---|---|---|
| Public scripting API | no prefix, camelCase | `setMaxSpeed`, `applyImpulse`, `resetJumps` |
| Private helpers | underscore prefix | `_tick`, `_trigger`, `_findPhysicsBehavior` |
| ACE delegate export | always `function` keyword, never arrow | `export default function(v) { this.setX(v); }` |

Public methods must not start with `_`. The underscore prefix is a signal to consumers that the method is internal and may change without notice.

---

### JSDoc for IDE autocomplete

Add JSDoc comments to public methods. C3's script editor (and VS Code via `.d.ts` or inline JSDoc) will surface these as autocomplete hints.

```js
/**
 * Set the maximum horizontal running speed.
 * @param {number} speed - Top speed in px/s.
 */
setMaxSpeed(speed) { this._maxSpeed = speed; }

/**
 * Apply an instantaneous velocity impulse.
 * Deceleration will naturally taper the extra velocity off.
 * @param {number} vx - Horizontal impulse in px/s (positive = right)
 * @param {number} vy - Vertical impulse in px/s (positive = down)
 */
applyImpulse(vx, vy) {
  if (this._phys) {
    this._phys.setVelocity(
      this._phys.getVelocityX() + vx,
      this._phys.getVelocityY() + vy
    );
  }
}
```

---

### Combo parameters in scripting calls

ACE combo parameters are numeric indices at runtime (see §16). When users call methods **directly from script** (bypassing the ACE), they pass the numeric index — not the string key. Document the index mapping:

```js
/**
 * Freeze or unfreeze a movement axis.
 * @param {number} axis - 0 = Horizontal, 1 = Vertical, 2 = Both
 * @param {boolean} freeze - true to freeze, false to unfreeze
 */
setFreezeAxis(axis, freeze) {
  const keys = ["horizontal", "vertical", "both"];
  const key = keys[axis] ?? keys[2];
  const val = !!freeze;
  if (key === "horizontal" || key === "both") this._freezeX = val;
  if (key === "vertical"   || key === "both") this._freezeY = val;
}
```

Script call:
```js
beh.setFreezeAxis(0, true);   // freeze horizontal
beh.setFreezeAxis(1, false);  // unfreeze vertical
beh.setFreezeAxis(2, true);   // freeze both
```

---

### Full example — behavior script API

This is the full scripting surface for a platformer physics behavior as seen from a C3 Script event:

```js
// Resolve the behavior instance
const beh = playerInst.behaviors.PlatformerPhysics;

// ── Configuration ──────────────────────────────────────────────────────────
beh.setMaxSpeed(300);           // top running speed (px/s)
beh.setAcceleration(2000);      // acceleration (px/s²)
beh.setDeceleration(2000);      // deceleration (px/s²)
beh.setJumpStrength(700);       // jump impulse (px/s)
beh.setGravity(1200);           // extra downward gravity (px/s²)
beh.setMaxFallSpeed(1200);      // terminal falling speed (px/s)

// ── Jumping ────────────────────────────────────────────────────────────────
beh.resetJumps();               // restore all jumps as if just landed
beh.setMaxJumps(2);             // double jump
beh.setJumpReleaseDamping(30);  // 30% of upward velocity kept on early release
beh.setWallJump(true);          // enable wall jumping
beh.setWallSlide(true);         // enable wall sliding

// ── Movement ───────────────────────────────────────────────────────────────
beh.setEnabled(false);          // disable the whole behavior
beh.setDefaultControls(false);  // stop reading keyboard
beh.setIgnoreInput(true);       // suppress SimulateControl and keyboard input
beh.setFreezeAxis(0, true);     // freeze horizontal axis (0=H, 1=V, 2=Both)
beh.setVector(150, 0);          // directly set Physics velocity
beh.setVectorX(150);            // set X only, Y unchanged
beh.setVectorY(-500);           // set Y only, X unchanged (negative = up)
beh.stop();                     // zero both velocity components

// ── Simulate controls ──────────────────────────────────────────────────────
// Call each tick for held controls; auto-release fires when you stop calling
beh.simulateControl(0);  // 0=left, 1=right, 2=jump, 3=jump_release, 4=stop

// ── Knockback ──────────────────────────────────────────────────────────────
beh.applyImpulse(-300, 0);           // additive impulse, decelerates naturally
beh.knockback(-400, -150, 0.4);      // set velocity + suppress input for 0.4s
```

---

### Accessing read-only state from script

Expressions with `expose: false` are NOT accessible from script. Read-only state should either be:

1. **Exposed via a getter method** added to the instance (preferred for frequently-read values)
2. **Read directly from the Physics behavior** via `inst.behaviors.Physics.getVelocityX()`

```js
// ✓ Option A: getter on the behavior instance
// In instance.js:
getSpeed() {
  if (!this._phys) return 0;
  const vx = this._phys.getVelocityX();
  const vy = this._phys.getVelocityY();
  return Math.sqrt(vx * vx + vy * vy);
}
isOnFloor()      { return this._onFloor; }
isJumping()      { return !this._onFloor && this._phys?.getVelocityY() < 0; }
isFalling()      { return !this._onFloor && this._phys?.getVelocityY() > 0; }
isWallSliding()  { return this._isWallSliding; }
isFacingRight()  { return this._facing === 1; }
getAirTime()     { return this._airTime; }
getJumpsRemaining() { return this._jumpsRemaining; }

// Script usage:
if (beh.isOnFloor()) { ... }
const spd = beh.getSpeed();
```

Add `expose: true` to the corresponding expression ACE (or create a new zero-param expression ACE for each getter) so the same code path is used from both event sheets and script.

---

### Registering a scripting interface (advanced)

For addons that want richer IDE support, C3 allows registering a **scripting interface class** via `plugin.js` or `type.js`. This exposes the interface to C3's TypeScript declaration generator. However, for most addons the JSDoc + `expose: true` pattern above is sufficient and simpler.

If you need the full scripting class registration, it looks like this in `src/runtime/plugin.js`:

```js
export default function (parentClass) {
  return class extends parentClass {
    // Override Script() to return your scripting interface
    // (only needed when C3 calls GetScriptInterface() on the type)
    // Most addons do NOT need this — expose: true on ACEs is enough.
  };
}
```

> For behavior addons, the C3 runtime automatically wraps the behavior instance in a scripting proxy that exposes all methods where `expose: true`. No additional registration is required unless you need a separate companion scripting class.

---

### Gotchas

**`this._phys` may be null before `_initialized`** — public methods called from script in the very first tick (before `_tick` has run its init guard) will find `_phys` as `null`. All public methods that touch `_phys` must guard with `if (this._phys)`.

**State mutation methods must be idempotent** — `setEnabled(false)` called twice must not corrupt state. Defensive `!!` coercion (`this._enabled = !!enabled`) prevents accidental truthy/falsy surprises.

**Methods called from script bypass `_ignoreInput`** — `simulateControl()` respects `_ignoreInput`, but `setVectorX()` or `knockback()` do not. This is intentional: the event sheet flag controls automated input, not explicit code-driven overrides.

---

## 27. ISDKInstanceBase — Runtime Plugin Instance API

`ISDKInstanceBase` is the runtime base class for **plugin** instances (not behaviors) in the addon SDK. It derives from the C3 internal `IInstance`. All methods below are available on `this` inside `src/runtime/instance.js` for plugin addons.

> **Behavior vs Plugin:** `ISDKBehaviorInstanceBase` (§26) is for behavior addons. `ISDKInstanceBase` is for object/world/DOM plugin addons. The lifecycle and ticking APIs are nearly identical; the key difference is `this.instance` does not exist — the instance *is* the plugin object, not a wrapper around one.

---

### Lifecycle overrides

```js
// Called when the instance is destroyed. Must call super._release().
_release() { super._release(); }

// Return a plain JSON object for savegames.
_saveToJson() { return {}; }

// Restore state from a prior _saveToJson() result.
_loadFromJson(o) {}

// Return debugger sections. See §12 for format.
_getDebuggerProperties() { return []; }
```

> Plugin instances do **not** have `_postCreate()`. Use `onCreate()` for post-construction setup (see §3).

---

### Property initialization

```js
this._getInitProperties()
// Call in constructor. Returns flat array of initial property values.
// Index order matches config.caw.js properties[] declaration order.
```

---

### Ticking utilities

| Method | Description |
|---|---|
| `this._setTicking(bool)` | Enable/disable `_tick()` (runs before events) |
| `this._setTicking2(bool)` | Enable/disable `_tick2()` (runs after events) |
| `this._isTicking()` | Whether `_tick()` is currently active |
| `this._isTicking2()` | Whether `_tick2()` is currently active |

```js
_tick()  {}  // every frame, before events — enable with _setTicking(true)
_tick2() {}  // every frame, after events  — enable with _setTicking2(true)
```

> Plugin instances have no `_postTick()` or `_setPostTicking()` — those are behavior-only (see §26).

> Calls do not stack. Three `_setTicking(true)` + one `_setTicking(false)` = ticking is off.

---

### Triggering conditions

```js
// Synchronous
this._trigger(C3.Plugins["addon_id"].Cnds.MyTrigger);

// Async — returns Promise; use when debugging breakpoints inside triggers matter
await this._triggerAsync(C3.Plugins["addon_id"].Cnds.MyTrigger);
```

In CAW, `this._trigger("MethodName")` wraps the above automatically (see §10).

---

### DOM-side communication

Only available when `hasDomside: true` in the plugin config.

```js
// Add handlers for messages sent from the DOM-side script
this._addDOMMessageHandler("my-reply", (data) => {});
this._addDOMMessageHandlers([
  ["reply-a", (data) => {}],
  ["reply-b", (data) => {}],
]);

// Send a message to the DOM-side script
this._postToDOM("my-msg", data);                  // fire-and-forget
const result = await this._postToDOMAsync("my-msg", data);  // await return value
this._postToDOMMaybeSync("my-msg", data);
// In DOM mode: calls the handler synchronously inside this call.
// In worker mode: posts the message (async, handled later).
// Use this when working around user-input restrictions in DOM mode.
```

---

### Wrapper extension methods

Only relevant if your plugin ships with a native wrapper extension (`.dll`/`.so`).

```js
// Check if the wrapper extension loaded successfully
this._isWrapperExtensionAvailable()              // boolean

// Receive messages from the wrapper extension
this._addWrapperExtensionMessageHandler(messageId, callback)
this._addWrapperMessageHandlers([[msgId, callback], ...])

// Send a message to the wrapper extension
// params: array of boolean | number | string values only
this._sendWrapperExtensionMessage(messageId, params)
await this._sendWrapperExtensionMessageAsync(messageId, params)
// Async variant resolves with the JSON data the wrapper extension responds with
```

> If `_isWrapperExtensionAvailable()` returns `false`, all sent messages are silently dropped and async messages return promises that never resolve. Always guard with an availability check.

---

### Minimal plugin runtime instance template

```js
export default function (parentClass) {
  return class extends parentClass {

    constructor() {
      super();
      // ✓ Safe: primitives, Maps, arrays, _getInitProperties()
      // ✓ this.runtime is NOT available here — use onCreate() for runtime access
      this._setTicking(true);
      const props = this._getInitProperties();
      // props[0], props[1], ... match config.caw.js properties[] order
    }

    onCreate() {
      // this.runtime is available here
      // Access layouts, layers, sibling objects, etc.
    }

    _tick() {
      const dt = this.runtime.dt;  // seconds
    }

    _tick2() {
      // after events
    }

    _release() {
      super._release();  // always required
    }

    _saveToJson() {
      return { myValue: this._myValue };
    }

    _loadFromJson(o) {
      this._myValue = o.myValue ?? 0;
    }

    _getDebuggerProperties() {
      return [{
        title: `$${this.type.name}`,
        properties: [
          { name: "$State", value: this._myValue },
        ],
      }];
    }
  };
}
```

---

## 28. ISDKUtils — Runtime Utilities (`runtime.sdk`)

`ISDKUtils` provides general-purpose APIs for addon SDK code. Access it via `this.runtime.sdk` from any plugin or behavior runtime instance.

```js
const sdk = this.runtime.sdk;  // ISDKUtils
```

---

### Loading

```js
sdk.addLoadPromise(promise)
// Add a Promise that the runtime waits to resolve before starting the first layout.
// Only valid while the project is still loading.
//
// IsSingleGlobal plugins: can be called in the constructor.
// All other plugins/behaviors: can only be called in the plugin/behavior constructor
// (src/runtime/plugin.js or the behavior type constructor), not the instance constructor.
//
// Use for: loading async resources (audio, WASM, remote config) before the game starts.
```

### Rendering

```js
sdk.updateRender()
// Signal Construct to draw a new frame.
// C3 skips rendering when nothing has visually changed.
// Call this whenever an internal state change would affect how something draws.
// ⚠ Do NOT call if the value is being set to the same thing — only on actual changes.
```

### Wrapper extension (cross-addon)

These are the cross-addon variants of the per-instance wrapper extension methods. Prefer the instance-specific methods (§27) in most cases — use these only when you need to message a *different* addon's wrapper extension.

```js
sdk.isWrapperExtensionAvailable(wrapperComponentId)   // boolean
sdk.sendWrapperExtensionMessage(wrapperComponentId, messageId, params)
await sdk.sendWrapperExtensionMessageAsync(wrapperComponentId, messageId, params)
```

### Object lookup

```js
sdk.getObjectClassBySid(sid)
// Returns IObjectClass with the given SID, or null.
// Use to resolve plugin "object" type properties, which provide a SID at runtime.
// (Also available as IProject.GetObjectClassBySID() on the editor side.)
```

### Suspend / resume

```js
sdk.isAutoSuspendEnabled          // boolean — get/set
// When true (default), runtime auto-suspends when the page/app goes to background.
// Set to false to take manual control via setSuspended().
// ⚠ Even with auto-suspend disabled, browsers may throttle background pages anyway.
// This API exists primarily for platforms that provide their own suspend/resume events.

sdk.setSuspended(isSuspended)     // true = pause runtime, false = resume
// Stops all ticking and drawing when suspended.
// Must be called in paired suspend/resume calls — do not suspend once but resume twice.
// Read current state via: this.runtime.isSuspended
```

### Version

```js
sdk.constructVersionCode          // number (read-only)
// Construct release number encoded as: (releaseNumber * 100) + patchNumber
// e.g. r123.4 → 12304
// Use for compatibility checks when feature detection alone is insufficient.
```

### Looping conditions

Used to implement looping conditions (ACEs with `"isLooping": true`). Looping conditions repeatedly retrigger the event — each retrigger runs all subsequent conditions, actions, and sub-events once.

```js
const ctx = sdk.createLoopingConditionContext(loopName?)
// loopName is optional. When provided, the System "loopindex" expression returns
// the current iteration index for this named loop (supports nested loops).
// Returns ILoopingConditionContext.
```

#### ILoopingConditionContext

```js
ctx.retrigger()   // Execute one iteration — runs all subsequent conditions/actions/sub-events
ctx.isStopped     // boolean (read-only) — true when the user called the System "Stop loop" action
ctx.release()     // MUST be called after the loop ends to clean up state
```

#### Example: looping condition implementation

```js
// ACE file: c.RepeatTimes.js
export const config = {
  listName: "Repeat N times",
  displayText: "Repeat {0} times",
  isTrigger: false,
  isLooping: true,    // ← marks this as a looping condition
  params: [{ id: "count", name: "Count", type: "number", initialValue: "3" }],
};

export default function (count) {
  const ctx = this.runtime.sdk.createLoopingConditionContext("MyLoopName");

  for (let i = 0; i < count; i++) {
    ctx.retrigger();
    if (ctx.isStopped) break;  // respect the System "Stop loop" action
  }

  ctx.release();  // always required after the loop finishes
}
```

> **`ctx.release()` is mandatory.** Omitting it leaks internal state and breaks subsequent loops.

> **Nested loops** — pass distinct names to `createLoopingConditionContext()` so `loopindex("MyLoopName")` returns the correct index for each nesting level.

---

## 29. Physics Platformer — Scripting API Reference

All public methods and getters are available from JavaScript via the behavior instance. Access the behavior from a runtime object instance:

```js
const plat = sprite.behaviors.PhysicsPlatformer;
```

Replace `PhysicsPlatformer` with whatever name the user gave the behavior in the editor.

---

### Configuration

```js
plat.setMaxSpeed(speed)         // Maximum horizontal speed (px/s)
plat.setAcceleration(accel)     // Rate of acceleration toward max speed (px/s²)
plat.setDeceleration(decel)     // Rate of deceleration to zero when no input (px/s²)
plat.setJumpStrength(strength)  // Upward impulse on jump (px/s)
plat.setGravity(gravity)        // Extra downward acceleration per tick (px/s²). 0 = Physics gravity only.
plat.setMaxFallSpeed(speed)     // Terminal fall velocity clamp (px/s)
```

---

### Jumping

```js
plat.resetJumps()                    // Restore all jumps as if just landed
plat.setMaxJumps(count)              // Total jumps before landing (1 = normal, 2 = double jump)
plat.setJumpReleaseDamping(percent)  // 0–100. How much upward velocity is kept on early release.
                                     // 0 = instant cut, 100 = no variable height. Default 50.
plat.setWallSlide(enabled)           // boolean — enable/disable wall sliding
plat.setWallJump(enabled)            // boolean — enable/disable wall jumping
```

---

### Movement & Input

```js
plat.setEnabled(enabled)             // boolean — disable to freeze all behavior logic
plat.setIgnoreInput(ignore)          // boolean — suppress all input (simulateControl included)
plat.setFreezeAxis(axis, freeze)     // axis: 0=Horizontal, 1=Vertical, 2=Both. freeze: boolean.

plat.setVector(vx, vy)               // Set both velocity components (px/s)
plat.setVectorX(vx)                  // Set horizontal velocity, preserve vertical (px/s)
plat.setVectorY(vy)                  // Set vertical velocity, preserve horizontal (px/s, negative = up)
plat.stop()                          // Zero both velocity components immediately

// Simulate a control input for this tick. Respects ignoreInput.
// Strings are case-insensitive; spaces, underscores, and hyphens are ignored.
plat.simulateControl("left")         // Move left
plat.simulateControl("right")        // Move right
plat.simulateControl("jump")         // Press jump (auto-releases the tick after you stop calling it)
plat.simulateControl("jumprelease")  // Manually release jump (for variable height cut)
plat.simulateControl("stop")         // Zero velocity and clear all input this tick

// Numeric index equivalents: 0=left, 1=right, 2=jump, 3=jumprelease, 4=stop
plat.simulateControl(0);
```

> **Tip:** Call `simulateControl("jump")` every tick the jump button is held. The behavior automatically fires the jump-release the first tick you stop calling it, giving correct variable jump height without manual tracking.

---

### Knockback & Impulse

```js
// Add a one-time velocity kick. Deceleration naturally tapers it off.
plat.applyImpulse(vx, vy)            // px/s added to current Physics velocity

// Set velocity and block all input for a fixed duration.
// Gravity, wall slide, and max fall speed still apply.
plat.knockback(vx, vy, duration)     // vx/vy in px/s, duration in seconds
```

---

### Ability State Getters

Read-only `get` properties — no `()` needed.

```js
plat.isCoyoteTimeEnabled    // true when coyoteTime property > 0
plat.isWallSlidingEnabled   // true when wall sliding is on
plat.isWallJumpEnabled      // true when wall jumping is on
plat.isVariableJumpEnabled  // true when variable jump height is on
```

---

### Example: AI-controlled character

```js
// In a runtime script or behavior tick:
const plat = this.behaviors.PhysicsPlatformer;

if (targetX > this.x) {
  plat.simulateControl("right");
} else {
  plat.simulateControl("left");
}

if (shouldJump && plat.isCoyoteTimeEnabled) {
  plat.simulateControl("jump");
}
```

### Example: Knockback on hit

```js
function onHit(attacker) {
  const plat = this.behaviors.PhysicsPlatformer;
  const dir = this.x < attacker.x ? -1 : 1;   // push away from attacker
  plat.knockback(dir * 400, -300, 0.4);         // 400 px/s sideways, 300 px/s up, 0.4 s
}
```

---

## 30. IRenderer — Runtime Rendering API

`IRenderer` is available in addon SDK Draw() methods and via layer "beforedraw"/"afterdraw" events. It abstracts WebGL/WebGPU behind high-level drawing commands.

### Renderer State

Every draw call uses the current persistent state. Always set all relevant state before drawing:

1. **Blend mode** — how pixels are composited
2. **Fill mode** — color fill, texture fill, or smooth line fill
3. **Color** — RGBA in [0, 1]; alpha = opacity in texture mode
4. **Texture** — only used in texture fill mode

```js
renderer.setAlphaBlendMode();        // premultiplied alpha blend (most common)
renderer.setBlendMode("normal");     // same as above; also: "additive", "multiply", "screen", etc.

renderer.setColorFillMode();         // draw solid color
renderer.setTextureFillMode();       // draw texture (alpha = opacity)
renderer.setSmoothLineFillMode();    // draw smooth lines

renderer.setColor([r, g, b, a]);     // array, values 0–1
renderer.setColorRgba(r, g, b, a);   // direct params, values 0–1
renderer.setOpacity(o);              // set alpha only, 0–1
renderer.resetColor();               // opaque white (1, 1, 1, 1)

renderer.setTexture(texture);                    // set texture; sampling defaults to "auto"
renderer.setTexture(texture, "nearest");         // or "bilinear" / "trilinear"
```

> **State is persistent** — the renderer does NOT reset between calls. Always specify full state for each new draw sequence.

### Drawing Primitives

```js
// Rectangles
renderer.rect(domRect);
renderer.rect2(left, top, right, bottom);

// Quads (DOMQuad)
renderer.quad(quad);
renderer.quad2(tlx, tly, trx, try_, brx, bry, blx, bly);  // 8 floats
renderer.quad3(quad, rcTex);            // quad + DOMRect for UV source
renderer.quad4(quad, texQuad);          // quad + DOMQuad for UV source
renderer.quad5(quad, texQuad, colorArr); // + Float32Array[16] per-vertex RGBA

// 3D quads (each point has X, Y, Z)
renderer.quad3D(tlx, tly, tlz, trx, try_, trz, brx, bry, brz, blx, bly, blz, rcTex);
renderer.quad3D2(..., texQuad);
renderer.quad3D3(..., texQuad, colorArr);

// Lines
renderer.line(x1, y1, x2, y2);
renderer.texturedLine(x1, y1, x2, y2, u, v);
renderer.lineRect(left, top, right, bottom);
renderer.lineRect2(rect);
renderer.lineQuad(quad);

// Line width / cap
renderer.pushLineWidth(w);
renderer.popLineWidth();
renderer.pushLineCap("butt");   // or "square"
renderer.popLineCap();

// Convex polygon
renderer.convexPoly(pointsArray);  // [x0,y0, x1,y1, ...] — min 6 elements (3 points)
```

> **`quad3()` is the key draw call for deformed sprites.** It takes a `DOMQuad` for world-space vertex positions and a `DOMRect` for the UV source rectangle.

### Drawing Raw Meshes — `drawMesh()`

Draw an array of textured triangles in a single call. All triangles share the same renderer state.

```js
renderer.drawMesh(posArr, uvArr, indexArr, colorArr?)
// posArr    — Float32Array  [x, y, z, x, y, z, ...]       (multiple of 3)
// uvArr     — Float32Array  [u, v, u, v, ...]              (multiple of 2)
// indexArr  — Uint16Array   [i, j, k, i, j, k, ...]       (multiple of 3, triangles)
// colorArr  — Float32Array  [r, g, b, a, ...]  (optional, multiple of 4, per-vertex)
```

> **`drawMesh()` uploads all data to the GPU on every call.** Fine for small meshes; inefficient for large ones. For large/stable meshes use `createMeshData()` + `drawMeshData()` instead (data stays on the GPU).

> **Max 64k vertices** (16-bit indices). For larger meshes use `createMeshData()`.

> **Layer Z elevation is NOT applied automatically.** If you need it, offset all Z components yourself.

#### Example — two quads in one call

```js
// quad = DOMQuad of first quad; rcTex = DOMRect of UV source
const posArr = new Float32Array([
  quad.p1.x, quad.p1.y, 0,  quad.p2.x, quad.p2.y, 0,
  quad.p3.x, quad.p3.y, 0,  quad.p4.x, quad.p4.y, 0,
  quad.p1.x + 200, quad.p1.y, 0,  quad.p2.x + 200, quad.p2.y, 0,
  quad.p3.x + 200, quad.p3.y, 0,  quad.p4.x + 200, quad.p4.y, 0,
]);

const uvArr = new Float32Array([
  rcTex.left, rcTex.top,    rcTex.right, rcTex.top,
  rcTex.right, rcTex.bottom, rcTex.left, rcTex.bottom,
  rcTex.left, rcTex.top,    rcTex.right, rcTex.top,
  rcTex.right, rcTex.bottom, rcTex.left, rcTex.bottom,
]);

const indexArr = new Uint16Array([0,1,2, 0,2,3, 4,5,6, 4,6,7]);

renderer.setAlphaBlendMode();
renderer.setTextureFillMode();
renderer.resetColor();
renderer.setTexture(myTexture);
renderer.drawMesh(posArr, uvArr, indexArr);
```

### GPU-Resident Meshes — `createMeshData()` / `drawMeshData()`

For large or frequently-drawn meshes, keep data on the GPU:

```js
// Create once
const meshData = renderer.createMeshData(vertexCount, indexCount, { debugLabel: "water" });

// Fill buffers (details via IMeshData interface — get positions/UVs/indices typed arrays)
// Mark changed ranges, then draw
renderer.drawMeshData(meshData);                       // draw all
renderer.drawMeshData(meshData, indexOffset, indexCount); // draw a range (indexCount % 3 === 0)
```

> `createMeshData()` supports more than 64k vertices (unlike `drawMesh()`).

### Texture Management

```js
// Load texture for an IImageInfo (addon SDK — e.g. from GetCurrentImageInfo())
const tex = await renderer.loadTextureForImageInfo(imageInfo, opts);
renderer.getTextureForImageInfo(imageInfo);   // returns ITexture | null (sync, after load)
renderer.releaseTextureForImageInfo(imageInfo);

// Create textures from image data
const tex = await renderer.createStaticTexture(imageElement, opts);   // immutable
const tex = renderer.createDynamicTexture(width, height, opts);       // updatable
renderer.updateTexture(data, tex, opts);      // replace content (must match size)
renderer.deleteTexture(tex);                  // release; only for textures you created

// Texture opts: { wrapX, wrapY, defaultSampling, mipMap }
// wrapX/wrapY: "clamp-to-edge" | "repeat" | "mirror-repeat"
// defaultSampling: "nearest" | "bilinear" | "trilinear"  (default "trilinear")
// mipMap: boolean (default true)
```

### Coordinate Transforms

```js
renderer.setLayerTransform(layer);   // default — co-ordinates match the given ILayer
renderer.setDeviceTransform();       // device pixels relative to screen (pixel-perfect)
```

### Z and Culling (3D content)

```js
renderer.setCurrentZ(z);            // Z for all 2D draw calls that don't specify Z
renderer.getCurrentZ();

renderer.setCullFaceMode("none");    // "none" | "back" | "front"
renderer.getCullFaceMode();

renderer.setFrontFaceWinding("cw"); // "cw" (default) | "ccw"
renderer.getFrontFaceWinding();
```

> Default cull mode is **"none"** because mirrored/flipped sprites show a back face. Default winding is **"cw"** matching Construct's own rendering.

---

## 31. IMeshData — GPU Mesh Buffers

`IMeshData` represents a set of long-lived vertex buffers that live persistently on the GPU. It is the efficient alternative to the renderer `drawMesh()` method, which uploads all vertex data on every call. Once an `IMeshData` is created its vertex and index counts are fixed — they cannot be resized.

**Create via:** `renderer.createMeshData(vertexCount, indexCount, options?)`  
**Draw via:** `renderer.drawMeshData(meshData, primitive?, ...)`  
**Key requirement:** After writing data to the arrays, call `markDataChanged()` (or `markAllVertexDataChanged()` + `markIndexDataChanged()`) at least once before drawing, otherwise the GPU buffers remain empty.

---

### IMeshData Properties

```js
meshData.vertexCount   // number (read-only) — vertex count fixed at creation
meshData.indexCount    // number (read-only) — index count fixed at creation
meshData.debugLabel    // string (read-only) — label set in createMeshData() options
```

### Data Arrays

```js
meshData.positions   // Float32Array  — length = 3 * vertexCount  (x, y, z per vertex)
meshData.texCoords   // Float32Array  — length = 2 * vertexCount  (u, v per vertex)
meshData.colors      // Float16Array | Float32Array — length = 4 * vertexCount  (r, g, b, a per vertex)
                     // Float16Array requires hardware support; type may vary between devices
meshData.indices     // Uint16Array | Uint32Array — length = indexCount
                     // Uint16Array used when vertexCount fits in 16 bits, else Uint32Array
```

> **`indices` are vertex indices, not element indices.** A `positions` array with 6 elements defines 2 vertices — index `1` refers to the second vertex (`x2, y2, z2`), not element `[1]`.

> **Index buffer specifies triangles** — `indexCount` should be a multiple of 3. If you are not using indexed rendering, fill `indices` with `0, 1, 2, 3, 4, 5, ...` to render vertices in order.

> **Premultiply colors before writing.** Like all C3 WebGL colors, `colors` expects premultiplied RGBA. Use `fillColor()` for solid uniform colors.

---

### Marking Data Changed

Data is not uploaded to the GPU until the relevant buffer is marked changed. Only mark the buffers and ranges you actually modified to minimize GPU upload cost.

```js
// Mark a specific buffer changed
meshData.markDataChanged(bufferType)                  // mark entire buffer
meshData.markDataChanged(bufferType, start)           // from start to end of buffer
meshData.markDataChanged(bufferType, start, end)      // from start up to (not including) end
// bufferType: "positions" | "texCoords" | "colors" | "indices"
// start/end are in vertices (for vertex buffers) or indices (for the index buffer)

// Shorthand: mark all three vertex buffers (positions + texCoords + colors)
meshData.markAllVertexDataChanged()                   // mark all vertex buffers entirely
meshData.markAllVertexDataChanged(start)
meshData.markAllVertexDataChanged(start, end)

// Shorthand: mark the index buffer
meshData.markIndexDataChanged()                       // mark entire index buffer
meshData.markIndexDataChanged(start)
meshData.markIndexDataChanged(start, end)
```

> **Always call `markIndexDataChanged()` at least once** after first-time setup, otherwise the GPU index buffer stays empty and nothing will render.

---

### Helper Methods

```js
// Fill the entire color buffer with a single color (premultiplied RGBA, 0–1).
// Useful when mesh has no per-vertex color — fill with opaque white (1,1,1,1)
// to keep original texture colors.
// ⚠ Does NOT mark the buffer changed — call markDataChanged("colors") or
//   markAllVertexDataChanged() afterwards.
meshData.fillColor(r, g, b, a)

// Free all CPU and GPU memory. The mesh data cannot be used after this.
meshData.release()
```

---

### Typical Setup Pattern

```js
// 1. Create (once, e.g. in onCreate())
const COLS = 10;
const ROWS = 5;
const vertexCount = (COLS + 1) * (ROWS + 1);
const indexCount  = COLS * ROWS * 6;   // 2 triangles × 3 indices per quad
this._meshData = renderer.createMeshData(vertexCount, indexCount);

// 2. Fill vertex arrays
const pos = this._meshData.positions;
const uv  = this._meshData.texCoords;
for (let r = 0; r <= ROWS; r++) {
  for (let c = 0; c <= COLS; c++) {
    const v = r * (COLS + 1) + c;
    const nx = c / COLS;   // normalized 0–1
    const ny = r / ROWS;
    pos[v * 3]     = nx;   // x
    pos[v * 3 + 1] = ny;   // y
    pos[v * 3 + 2] = 0;    // z
    uv[v * 2]     = nx;    // u
    uv[v * 2 + 1] = ny;    // v
  }
}

// 3. Fill index buffer
const idx = this._meshData.indices;
let i = 0;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const tl = r * (COLS + 1) + c;
    const tr = tl + 1;
    const bl = tl + (COLS + 1);
    const br = bl + 1;
    idx[i++] = tl;  idx[i++] = tr;  idx[i++] = bl;
    idx[i++] = tr;  idx[i++] = br;  idx[i++] = bl;
  }
}

// 4. Fill colors (white = preserve texture color)
this._meshData.fillColor(1, 1, 1, 1);

// 5. Mark everything changed for first upload
this._meshData.markAllVertexDataChanged();
this._meshData.markIndexDataChanged();
```

### Per-Frame Update Pattern

```js
// In _tick() or draw callback — only update what changed
const pos = this._meshData.positions;
for (let v = 0; v < vertexCount; v++) {
  pos[v * 3 + 1] = computeY(v);  // update Y only
}
// Mark only positions changed
this._meshData.markDataChanged("positions");
// Then draw:
renderer.drawMeshData(this._meshData);
```

---

### Gotchas

- **Vertex count and index count are fixed at creation.** If the mesh topology changes, release and recreate.
- **`fillColor()` does not mark the buffer changed.** Always follow it with `markDataChanged("colors")` or `markAllVertexDataChanged()`.
- **`colors` element type varies.** Both `Float16Array` and `Float32Array` accept the same `0–1` float inputs — write values normally, C3 handles the type internally.
- **`indices` element type also varies** (Uint16 vs Uint32) based on vertex count. Assign values normally — JS typed arrays handle the range automatically.
- **Release in `_release()`.** Always call `meshData.release()` when the instance is destroyed to free GPU memory.

> Default cull mode is **"none"** because mirrored/flipped sprites show a back face. Default winding is **"cw"** matching Construct's own rendering.

---

## 32. ICollisionEngine Script Interface

`ICollisionEngine` provides access to Construct's collision engine. Access it via `runtime.collisions`.

```js
const col = runtime.collisions;  // ICollisionEngine
```

### General

```js
col.runtime   // IRuntime — reference back to the runtime
```

### Collision Tests

```js
// Test if two IWorldInstances are overlapping at their current positions
col.testOverlap(instA, instB)
// → boolean

if (runtime.collisions.testOverlap(instA, instB)) {
  console.log("Collision found!");
}

// Test if an IWorldInstance overlaps any instance from an iterable
// Returns the first overlapping IWorldInstance, or null
col.testOverlapAny(inst, iterable)
// → IWorldInstance | null  (truthy/falsey safe)

// Test if an IWorldInstance overlaps any instance with the Solid behavior
// Returns the first overlapping solid IWorldInstance, or null
col.testOverlapSolid(inst)
// → IWorldInstance | null  (truthy/falsey safe)
```

### Collision Cell Tuning

Construct sorts all objects into spatial "cells" to accelerate broadphase collision queries. The default cell size is the viewport size. Smaller cells help "bullet hell" style games with many objects in a small area; larger cells reduce overhead when objects are spread out.

```js
col.setCollisionCellSize(width, height)   // set cell size in pixels
col.getCollisionCellSize()                // → [width, height]
```

> **Use performance measurements to find the optimal cell size.** The setting also affects how many instances `getCollisionCandidates()` returns.

### Broadphase Candidate Query

```js
col.getCollisionCandidates(iObjectClasses, domRect)
// iObjectClasses — IObjectClass or IObjectClass[] (includes families)
// domRect        — DOMRect specifying the area of interest in layout co-ordinates
// → IWorldInstance[]
```

Returns instances near `domRect`. All instances **inside** the rect are returned; some near-but-outside instances may also appear (snapped to cell resolution). Instances far away are excluded.

> **The returned array may contain duplicates.** Use `new Set(candidates)` to deduplicate when the algorithm requires unique results (e.g. scoring). Skip deduplication when a repeated check is harmless (e.g. destroy-on-first-hit).

This is the same method described in §17 but documented here with its full interface.

---

## 33. IStorage Script Interface

`IStorage` wraps IndexedDB-based key-value storage. Accessed via `runtime.storage`. Shares the same storage as the Local Storage plugin — data written from script is readable in event sheets (for string/number values), and vice versa. Storage is scoped to the specific project.

```js
const storage = runtime.storage;
```

### APIs

```js
// Read a value. Resolves to the value, or null if the key doesn't exist.
// Also resolves to null on read errors (does not throw).
await storage.getItem(key)
// → any | null

// Write a value. Resolves when the write completes.
// Rejects if the write fails (e.g. storage quota exceeded) — use try/catch.
await storage.setItem(key, value)

// Delete a key. Resolves when the removal completes.
await storage.removeItem(key)

// Delete all items. Resolves when the clear completes.
await storage.clear()

// Get all key names. Resolves to an array of strings.
await storage.keys()
// → string[]
```

### Notes

- Any value that can be stored in IndexedDB is supported: numbers, strings, Blobs, ArrayBuffers, plain objects, etc.
- The event sheet can only read/write strings and numbers. If script stores another type, it won't be usable from event-sheet expressions.
- Wrap `setItem` calls in `try/catch` — storage-full errors reject the promise and will crash if unhandled.

```js
try {
  await runtime.storage.setItem("highScore", score);
} catch (e) {
  console.warn("Storage write failed:", e);
}
```

---

## 34. IAssetManager Script Interface

`IAssetManager` provides access to project assets (audio, project files, scripts, WASM). Accessed via `runtime.assets`.

On modern platforms, standard `fetch()` works directly. Use `IAssetManager` when targeting environments where direct fetch is blocked (e.g. Playable Ads, legacy export options).

```js
const assets = runtime.assets;  // IAssetManager
```

### General

```js
assets.runtime          // IRuntime — reference back to the runtime
assets.mediaFolder      // string — subfolder for audio/video files
                        //   empty string in preview; "media/" after export
assets.projectFileList  // read-only array — list of project files at preview/export time
                        //   each entry: { name: string, size: number }
                        //   name is the relative path, e.g. "subfolder/mydata.json"
```

> **`projectFileList` is a snapshot.** It reflects the state at preview/export time, not post-export file changes.

### Fetching

```js
await assets.fetchText(url)          // → string
await assets.fetchJson(url)          // → any (parsed JSON)
await assets.fetchBlob(url)          // → Blob
await assets.fetchArrayBuffer(url)   // → ArrayBuffer

// Resolve a URL for direct use (e.g. as <video src>)
// May return the original URL or a blob: URL depending on export platform
await assets.getProjectFileUrl(url)  // → string (URL safe for direct fetch/assignment)
await assets.getMediaFileUrl(url)    // → string (same, but for audio/video in the media folder)
```

### Loading Scripts

```js
// Fetch and execute JS files from the project Files folder.
// Scripts run in order when multiple are specified.
// Load all needed scripts in one call for best efficiency.
await assets.loadScripts("lib1.js", "lib2.js")
```

### WebAssembly

```js
// Fetch and compile a .wasm file using streaming compilation where supported.
// Returns a WebAssembly.Module — must be instantiated before use.
const module = await assets.compileWebAssembly("game.wasm");
const instance = await WebAssembly.instantiate(module, imports);
```

### Stylesheets

```js
// Fetch and apply a CSS stylesheet to the document.
await assets.loadStyleSheet("styles.css")
```

---

## 35. IAABB3D Script Interface

`IAABB3D` represents an axis-aligned bounding box in 3D space, with minimum and maximum extents on the X, Y, and Z axes. Returned by `IWorldInstance.getBoundingBox3d()`.

```js
const bb = inst.getBoundingBox3d();  // IAABB3D
```

### Constructor

```js
new IAABB3D(left, top, back, right, bottom, front)
// All parameters optional — default to 0
```

### Properties

```js
bb.left    // minimum X
bb.top     // minimum Y
bb.back    // minimum Z
bb.right   // maximum X
bb.bottom  // maximum Y
bb.front   // maximum Z
```

### Methods

```js
bb.clone()                                        // → new IAABB3D (copy)
bb.copy(other)                                    // set this from another IAABB3D
bb.set(left, top, back, right, bottom, front)    // set all properties at once
```

---

## 36. Instance & Behavior Instance Event Properties

Events fired on `IInstance` or `IBehaviorInstance` pass an event object to the handler. The standard properties are listed below; each specific event type may add additional properties.

### Instance events (fired on `IInstance` and derivatives)

```js
inst.addEventListener("someevent", (e) => {
  e.instance   // IInstance (or derivative) that fired the event
});
```

### Behavior instance events (fired on `IBehaviorInstance` and derivatives)

```js
behaviorInst.addEventListener("someevent", (e) => {
  e.instance          // IInstance (or derivative) associated with the behavior
  e.behaviorInstance  // IBehaviorInstance that fired the event
});
```

### World instance "hierarchyready" event

A special event fired on the **root** `IWorldInstance` of a scene graph hierarchy after all instances in the hierarchy have finished creating (including triggering "On created" in event sheets). Use it to safely initialize logic that depends on child instances existing.

```js
rootInst.addEventListener("hierarchyready", () => {
  // All children of rootInst are guaranteed to exist here
  for (const child of rootInst.allChildren()) {
    // configure child ...
  }
});
```

> **Only fires for the root instance.** Children do not receive this event. Iterate children from the root using `allChildren()`.

---

## 37. ILoopingConditionContext — Looping Conditions

`ILoopingConditionContext` drives looping ACE conditions. It is created by `runtime.sdk.createLoopingConditionContext()` (see §28 for the creation call). This section documents the interface itself.

```js
const ctx = this.runtime.sdk.createLoopingConditionContext("MyLoop");
```

### APIs

```js
ctx.retrigger()   // Execute one iteration — runs all subsequent conditions, actions,
                  // and sub-events within this looping condition call

ctx.isStopped     // boolean (read-only) — true when the user invoked "Stop loop"
                  // Check this after each retrigger() and break if true

ctx.release()     // MUST be called after the loop ends — cleans up internal state
```

### Pattern

```js
export default function (count) {
  const ctx = this.runtime.sdk.createLoopingConditionContext("MyLoop");

  for (let i = 0; i < count; i++) {
    ctx.retrigger();
    if (ctx.isStopped) break;
  }

  ctx.release();  // mandatory — always in a finally block for safety
}
```

> **`ctx.release()` is mandatory.** Omitting it leaks state and breaks subsequent loops. Use a `try/finally` block if the loop body can throw.

> **Nested loops** require distinct loop names so `loopindex("name")` resolves to the correct iteration for each level.

---

## 38. IWorldInstance Script Interface

`IWorldInstance` represents a single instance of an object type that appears in a layout. It derives from `IInstance`. Access instances via `IObjectClass` methods like `runtime.objects.Sprite.getFirstInstance()`.

> Do not confuse `runtime.objects.Sprite` (`IObjectClass`) with an instance — the class has no position. Get an instance first: `runtime.objects.Sprite.getFirstInstance().x`.

### General

```js
inst.layout   // ILayout — the layout the instance is on
inst.layer    // ILayer  — the layer the instance is on
```

### Position

```js
inst.x
inst.y
inst.setPosition(x, y)
inst.getPosition()           // → [x, y]
inst.offsetPosition(dx, dy)  // adds dx/dy to x/y

inst.z                       // Z co-ordinate relative to its layer
inst.totalZ                  // read-only: Z + layer's Z elevation (absolute scene Z)

inst.setPosition3d(x, y, z)
inst.offsetPosition3d(dx, dy, dz)
inst.getPosition3d()         // → [x, y, z]
```

### Origin

```js
inst.originX                    // normalized 0–1: 0=left, 0.5=centre, 1=right
inst.originY                    // normalized 0–1: 0=top, 0.5=centre, 1=bottom
inst.setOrigin(originX, originY)
inst.getOrigin()                // → [originX, originY]
```

> With Sprite objects, changing the animation frame updates the origin according to the Animations Editor origin placement.

### Size

```js
inst.width
inst.height
inst.depth          // 0 for 2D objects; relevant for 3D only
inst.setSize(width, height)
inst.setSize3d(width, height, depth)
inst.getSize()      // → [width, height]
inst.getSize3d()    // → [width, height, depth]
```

### Angle

```js
inst.angle         // radians — changing this updates angleDegrees
inst.angleDegrees  // degrees — changing this updates angle
```

### Bounding Box / Quad

```js
inst.getBoundingBox(ignoreMesh = false)    // → DOMRect (layout co-ords, copy)
inst.getBoundingBox3d(ignoreMesh = false)  // → IAABB3D  (layout co-ords, copy)
inst.getBoundingQuad(ignoreMesh = false)   // → DOMQuad  (layout co-ords, copy, includes rotation)
```

> Returns a **copy** — changes to the returned value do not affect the instance, and the value does not update if the instance moves.

> `ignoreMesh = false` (default) accounts for mesh distortion. Pass `true` to get the undeformed bounds.

### Appearance

```js
inst.isVisible         // boolean — get/set
inst.isOnScreen()      // → boolean — true if any part of bounding box is in screen area
                       //   not affected by isVisible or opacity

inst.opacity           // number 0–1: 0=transparent, 1=opaque
inst.colorRgb          // [r, g, b] array (0–1 each) — color filter
inst.blendMode         // string — "normal", "additive", "multiply", "screen", etc.
inst.sampling          // "auto" | "nearest" | "bilinear" | "trilinear"
inst.activeSampling    // read-only — resolved sampling mode (differs from sampling when "auto")
inst.effects           // IEffectInstance[] — per-effect parameter access
```

### Z Order

```js
inst.moveToTop()                          // move to top of current layer
inst.moveToBottom()                       // move to bottom of current layer
inst.moveToLayer(layer)                   // move to top of a different ILayer
inst.moveAdjacentToInstance(other, isAfter)
  // isAfter=true → just above other; false → just below. Also moves to same layer if needed.
inst.zIndex                               // read-only integer — current Z index on the layer (0=back)
```

### Collision

```js
inst.isCollisionEnabled           // boolean get/set — false = always fails overlap checks
inst.containsPoint(x, y)          // → boolean — point-in-collision-polygon test
inst.testOverlap(wi)              // → boolean — overlap check against another IWorldInstance
inst.testOverlapSolid()           // → IWorldInstance | null — first overlapping Solid instance
                                  //   truthy/falsey safe; respects solid collision filtering
```

### Mesh Distortion

```js
inst.createMesh(hsize, vsize)     // create mesh (minimum 2×2)
inst.releaseMesh()                // revert to default rendering, no mesh
inst.setMeshPoint(col, row, opts) // opts: { mode, x, y, z, u, v }
                                  //   mode: "absolute" (default) or "relative"
                                  //   x, y: position offset in normalized [0,1] co-ords
                                  //   z: absolute Z offset (3D distortion)
                                  //   u, v: texture co-ords in [0,1]; omit / set to -1 to leave unchanged
inst.getMeshPoint(col, row)       // → opts object (always absolute values)
inst.getMeshSize()                // → [hsize, vsize], or [0, 0] if no mesh
```

### Scene Graph

```js
inst.getParent()           // → IWorldInstance | null
inst.getTopParent()        // → IWorldInstance | null
inst.parents()             // generator — walks up parent chain
inst.getChildCount()       // → number
inst.getChildAt(index)     // → IWorldInstance | null
inst.children()            // generator — direct children
inst.allChildren()         // generator — all descendants recursively

inst.addChild(wi, opts)
// opts boolean properties (all default false):
//   transformX, transformY, transformZ
//   transformWidth, transformHeight
//   transformAngle, transformOpacity, transformVisibility
//   destroyWithParent

inst.getHierarchyOpts()    // → opts object matching addChild() format (current child settings)
inst.removeChild(wi)       // detach a previously added child
inst.removeFromParent()    // shorthand: removes this instance from its parent
```

> `addChild()` has no effect if `wi` already has a parent. Remove it from the existing parent first.

> `getHierarchyOpts()` returns the opts object as-is — can be passed directly to a new `addChild()` call to re-use the same options.

### "hierarchyready" Event

```js
rootInst.addEventListener("hierarchyready", () => {
  // All instances in the hierarchy have been created.
  // Safe to inspect/configure the full hierarchy here.
  for (const child of rootInst.allChildren()) { /* ... */ }
});
```

> Only fires on the **root** instance (the one with no parent). Children do not receive this event.

---

## 39. IPlugin Script Interface

`IPlugin` represents a plugin (e.g. the Sprite plugin). A plugin exists once in the project; multiple Sprite *object types* each have their own `IObjectClass`, but they all share one `IPlugin`.

### Properties

```js
plugin.runtime                  // IRuntime — reference back to the runtime
plugin.id                       // string (read-only) — unique plugin identifier set by the developer
plugin.isSingleGlobal           // boolean (read-only) — true when only one global instance exists (e.g. Mouse)
plugin.isWorldType              // boolean (read-only) — true when the plugin appears in layouts
plugin.isHTMLElementType        // boolean (read-only) — true when the plugin creates an HTML element
plugin.isRotatable              // boolean (read-only) — true when instances may be rotated
plugin.hasEffects               // boolean (read-only) — true when the plugin may use effects
plugin.is3d                     // boolean (read-only) — true when the plugin has Z-axis depth
plugin.supportsHierarchies      // boolean (read-only) — true when instances may be used in hierarchies
plugin.supportsMesh             // boolean (read-only) — true when instances may use mesh distortion
```

### Single-global accessors

Only valid when `isSingleGlobal` is `true`:

```js
plugin.getSingleGlobalObjectType()   // → IObjectClass — the sole object class for this plugin
plugin.getSingleGlobalInstance()     // → IInstance    — the sole instance for this plugin
```

### Static lookup

```js
IPlugin.getByConstructor(C3.Plugins.Audio)
// → IPlugin | null — returns the IPlugin for a given constructor in the C3.Plugins namespace.
// Returns null if the plugin is not used in the project.
```

---

## 40. IObjectClass Script Interface

`IObjectClass` is the base class shared by `IObjectType` and `IFamily`. Most APIs for working with instances live here.

### Object class events

```js
objectClass.addEventListener("instancecreate", (e) => {
  e.instance   // IInstance (or derivative) — the newly created instance
});

objectClass.addEventListener("hierarchyready", (e) => {
  e.instance   // IWorldInstance (or derivative) — the root of the completed hierarchy
});

objectClass.addEventListener("instancedestroy", (e) => {
  e.instance         // IInstance (or derivative) — the destroyed instance (now invalid)
  e.isEndingLayout   // boolean — true if destroyed because the layout is ending
  // Clear any references to e.instance here — accessing it afterwards throws
});
```

### APIs

```js
objectClass.runtime   // IRuntime
objectClass.plugin    // IPlugin (or derivative)
objectClass.name      // string (read-only) — the object class name

objectClass.addEventListener(eventName, callback)
objectClass.removeEventListener(eventName, callback)

// Instance access
objectClass.getAllInstances()         // → IInstance[] (or derivatives)
objectClass.getFirstInstance()        // → IInstance | null
objectClass.*instances()              // generator — iterates all instances

// Event-sheet picked instances (only useful in script-in-event-sheet context)
objectClass.getPickedInstances()      // → IInstance[]
objectClass.getFirstPickedInstance()  // → IInstance | null
objectClass.*pickedInstances()        // generator

// Pairing (matches IID-based pairing logic used by the event system)
objectClass.getPairedInstance(inst)
// Returns the instance of this object class at the same IID as inst.
// Wraps around if this class has fewer instances than inst's class.

// Custom actions (call event-sheet custom actions from script)
objectClass.callCustomAction(name, instances, ...params)
// name      — case-insensitive string of the custom action name
// instances — iterable of IInstance belonging to this class (picks them for the action)
// params    — values passed to the custom action parameters
// More efficient to call once with multiple instances than repeatedly with one each time.
```

---

## 41. IObjectType Script Interface

`IObjectType` derives from `IObjectClass` and represents one specific object type (e.g. one Sprite object). It adds instance-creation and family-membership APIs not available on the base class.

### APIs

```js
// Instance creation
objectType.createInstance(layerNameOrIndex, x, y, createHierarchy?, template?)
// layerNameOrIndex — case-insensitive layer name string, or zero-based layer index
// x, y             — position in layout co-ordinates
// createHierarchy  — if true, also creates all scene-graph children with connections in place
// template         — optional template name to base the new instance on
// → IInstance (or derivative)

// Family membership
objectType.getAllFamilies()         // → IFamily[]
objectType.*families()             // generator — all families this type belongs to
objectType.isInFamily(family)      // → boolean
```

> `createInstance()` returns the script interface for the new instance. If `createHierarchy` is `true` and the object type has children configured in the Layout View, those children are also created and linked automatically.

---

## 42. IFamily Script Interface

`IFamily` derives from `IObjectClass` and represents a family of object types. All `IObjectClass` methods (instance iteration, events, etc.) work on families and cover all member object types.

### APIs

```js
family.getAllObjectTypes()         // → IObjectType[] — all member object types
family.*objectTypes()             // generator — iterates all member object types
family.hasObjectType(objectType)  // → boolean — true if objectType is a member
```

### Access pattern

```js
// Access via runtime.objects (same as object types)
const family = runtime.objects.EnemyFamily;  // IFamily
for (const inst of family.instances()) {
  // inst is any instance of any member type
}
```

---

## 43. IInstance Script Interface

`IInstance` represents a single instance of an object type. Instances that appear in layouts use `IWorldInstance` (which derives from `IInstance`), so all properties below are available on world instances too.

### Instance events

```js
inst.addEventListener("destroy", (e) => {
  e.isEndingLayout  // boolean — true if destroyed at end of layout
  // Clear all references to this instance here — it is invalid after this event
});
```

### APIs

```js
inst.addEventListener(type, func, capture?)
inst.removeEventListener(type, func, capture?)
inst.dispatchEvent(e)    // fire a custom event; create with: new C3.Event("name", isCancellable)

inst.runtime             // IRuntime
inst.objectType          // IObjectType — the instance's object type
inst.plugin              // IPlugin (or derivative) — the instance's plugin
inst.uid                 // number (read-only) — unique ID; use runtime.getInstanceByUid(uid) to look up
inst.iid                 // number (read-only) — index ID within the object type
inst.templateName        // string (read-only) — template name used to create this instance, or ""

// Instance variables (if any)
inst.instVars.health     // named access
inst.instVars["health"]  // string-key access (for non-identifier names)

// Behaviors (if any)
inst.behaviors.Bullet                 // named access
inst.behaviors["8Direction"]          // string-key access

inst.destroy()           // destroy this instance; do not use it after calling this
// For destroying many instances efficiently, use runtime.destroyMultiple() instead

// Container
inst.getOtherContainerInstances()     // → IInstance[] — other instances in the same container
inst.*otherContainerInstances()       // generator

// Time scale
inst.dt                  // delta-time using the instance's own time scale
inst.timeScale           // get/set instance-specific time scale (e.g. 1.0=normal, 0=paused)
inst.restoreTimeScale()  // revert to following the runtime time scale

// Signals (co-routine / async coordination)
inst.signal(tag)         // trigger "On signal" for this instance; resolves waitForSignal()
await inst.waitForSignal(tag)  // returns a Promise that resolves when tag is signalled

// Tags
inst.hasTag(tag)         // → boolean — check a single tag (more efficient than hasTags for one tag)
inst.hasTags(...tags)    // → boolean — check multiple tags (all must be present)
inst.setAllTags(tags)    // set all tags from any iterable of strings (replaces existing)
inst.getAllTags()         // → Set<string> — all current tags

// Custom actions (shorthand for single-instance calls)
inst.callCustomAction(name, ...params)
// Equivalent to: inst.objectType.callCustomAction(name, [inst], ...params)
// Prefer objectType.callCustomAction() when acting on multiple instances at once
```

---

## 44. IDOMInstance Script Interface

`IDOMInstance` represents an instance that renders a DOM element (e.g. Button, TextBox). It derives from `IWorldInstance`.

```js
domInst.focus()                   // focus the DOM element
domInst.blur()                    // remove focus from the DOM element
domInst.setCssStyle(prop, val)    // apply a CSS style (CSS property name + value strings)
                                  // e.g. domInst.setCssStyle("background-color", "red")
domInst.getElement()              // → HTMLElement — direct DOM element access
                                  // ⚠ Throws in worker mode — only call on the main thread
```

> `setCssStyle()` works in worker mode. `getElement()` does not — gate it with a thread check if needed.

---

## 45. IBehaviorInstance Script Interface (Runtime)

`IBehaviorInstance` represents a behavior attached to an `IInstance`. Access it via `inst.behaviors.BehaviorName`. Many built-in behaviors return a subclass with additional behavior-specific APIs (see the Behavior interfaces reference).

```js
// Events
behaviorInst.addEventListener(type, func, capture?)
behaviorInst.removeEventListener(type, func, capture?)
behaviorInst.dispatchEvent(e)    // fire a custom event; create with: new C3.Event("name", isCancellable)

// References
behaviorInst.instance       // IInstance — the object instance this behavior is on
behaviorInst.behavior       // IBehavior — the behavior kind (e.g. Solid, Physics)
behaviorInst.behaviorType   // IBehaviorType — the behavior type
behaviorInst.runtime        // IRuntime
```

### Access pattern

```js
const sprite = runtime.objects.Sprite.getFirstInstance();
const plat   = sprite.behaviors.Platform;   // IBehaviorInstance (Platform subclass)
plat.isOnFloor;   // behavior-specific API
```

### Dispatching custom events from addon SDK

```js
// In addon runtime instance code (src/runtime/instance.js):
const e = new C3.Event("arrived", true);
this.GetScriptInterface().dispatchEvent(e);

// Script listener:
behaviorInst.addEventListener("arrived", () => { ... });
```

---

## 46. IAnimationFrame Script Interface (Runtime)

`IAnimationFrame` represents one frame within an `IAnimation` at runtime. It derives from `IImageInfo`. Positions (origin, image points, collision polygon) are **normalized** (0–1 relative to the frame), not layout co-ordinates.

> This is the **runtime** interface. The **editor-side** `IAnimationFrame` (§20) has a different API set.

```js
frame.duration          // number (read-only) — relative duration; 1=normal, 2=twice as long
frame.tag               // string — tag assigned to this frame in the Animation Editor

// Origin
frame.originX           // number (read-only) — normalized 0–1
frame.originY           // number (read-only) — normalized 0–1
frame.getOrigin()       // → [originX, originY]

// Image points
frame.getImagePointCount()          // → number
frame.getImagePointX(nameOrIndex)   // → number (normalized 0–1); returns origin if not found
frame.getImagePointY(nameOrIndex)   // → number (normalized 0–1); returns origin if not found
frame.getImagePoint(nameOrIndex)    // → [x, y] (normalized 0–1)

// Collision polygon
frame.getPolyPointCount()           // → number
frame.getPolyPointX(index)          // → number — normalized, relative to origin
frame.getPolyPointY(index)          // → number — normalized, relative to origin
frame.getPolyPoint(index)           // → [x, y] — normalized, relative to origin
```

### Coordinate system for poly points

Collision polygon points are **normalized and relative to the origin**. When the origin is at `(0.5, 0.5)`, the top-left corner has coordinates `(-0.5, -0.5)`.

To convert to world-space (see also §17):

```js
const wx = inst.x + frame.getPolyPointX(i) * inst.width;
const wy = inst.y + frame.getPolyPointY(i) * inst.height;
```

> **Runtime vs editor poly point APIs differ.** The editor `ICollisionPoly` (§20) returns absolute texture-coord points via `GetPoints()`. The runtime `IAnimationFrame` returns origin-relative normalized points via `getPolyPointX/Y()`.

---

## 47. IAnimation Script Interface (Runtime)

`IAnimation` represents one named animation of a Sprite-like plugin. Frames are accessed via `IAnimationFrame` (§46).

```js
anim.name           // string (read-only) — animation name
anim.speed          // number (read-only) — playback speed in frames per second
anim.isLooping      // boolean (read-only) — true if animation repeats at the end
anim.repeatCount    // number (read-only) — how many times to repeat
anim.repeatTo       // number (read-only) — zero-based frame index to jump back to on repeat
anim.isPingPong     // boolean (read-only) — true if animation reverses at the start/end
anim.frameCount     // number (read-only) — total number of frames

anim.getFrames()    // → IAnimationFrame[] — all frames in sequence
anim.*frames()      // generator — iterates all IAnimationFrame in sequence
```

### Access pattern

```js
// Typically accessed via a Sprite instance's ISpriteInstance API
const sprite = runtime.objects.Sprite.getFirstInstance();
const anim = sprite.animation;       // IAnimation — current animation
const frame = anim.getFrames()[0];   // IAnimationFrame — first frame
```

> All properties on `IAnimation` are **read-only** — use the Sprite behavior's animation actions from the event sheet to change animation state at runtime.

---

## 48. IRuntime Script Interface

`IRuntime` is the main scripting interface to the Construct engine. Accessed as `runtime` in event-sheet scripts (passed as a parameter) and via `runOnStartup()` in script files.

### Runtime Events

Listen with `runtime.addEventListener(eventName, callback)`.

| Event | Description |
|---|---|
| `"resize"` | Display size changed. Event has `cssWidth`, `cssHeight`, `deviceWidth`, `deviceHeight`. |
| `"window-maximized"` / `"window-minimized"` | App window state; desktop exports only. |
| `"pretick"` / `"tick"` / `"tick2"` | Per-tick hooks. Order: pretick → behaviors tick → tick → event sheets run → tick2. |
| `"beforeprojectstart"` / `"afterprojectstart"` | Fires once on first layout start (before/after On start of layout). Supports async handlers. |
| `"beforeanylayoutstart"` / `"afteranylayoutstart"` | Fires on every layout start. Event has `layout` property. Supports async handlers. |
| `"beforeanylayoutend"` / `"afteranylayoutend"` | Fires on every layout end. Event has `layout` property. Supports async handlers. |
| `"keydown"` / `"keyup"` | Keyboard input (copies of `KeyboardEvent`). |
| `"mousedown"` / `"mousemove"` / `"mouseup"` / `"dblclick"` | Mouse input (copies of `MouseEvent`). Use pointer events to cover both mouse and touch. |
| `"wheel"` | Mouse wheel (`WheelEvent`). |
| `"pointerdown"` / `"pointermove"` / `"pointerup"` / `"pointercancel"` | Pointer input (mouse, pen, touch). Copies of `PointerEvent`. Mouse-type pointers have an extra `lastButtons` property. |
| `"deviceorientation"` / `"devicemotion"` | Orientation/motion sensor. Requires permission via `touch.requestPermission()`. |
| `"suspend"` / `"resume"` | App going to background / returning to foreground. |
| `"save"` / `"load"` | Savegame system. Event has `saveData` (plain JSON). Supports async handlers. |
| `"instancecreate"` | Any instance created. Event has `instance` property. |
| `"hierarchyready"` | Root instance of a hierarchy fully created. Event has `instance` property. |
| `"instancedestroy"` | Any instance destroyed. Event has `instance` and `isEndingLayout`. Do not use the instance after this. |
| `"loadingprogress"` | Fires when `loadingProgress` changes on a loader layout. |
| `"afterload"` (SDK) | Fired after `_loadFromJson()` when restoring saved state — use `getInstanceByUid()` here. |

### Runtime APIs

```js
// Event listeners
runtime.addEventListener(eventName, callback)
runtime.removeEventListener(eventName, callback)

// Object access
runtime.objects                        // object with a property per object class (IObjectClass)
runtime.objects.Sprite                 // IObjectClass for Sprite
runtime.objects["Sprite"]              // string-key access for non-identifier names
runtime.getInstanceByUid(uid)          // IInstance | null

// Global variables (event sheet)
runtime.globalVars.Score               // direct property access
runtime.globalVars["Score"]            // string-key access

// Shorthand plugin refs (only set if the plugin is added to the project)
runtime.mouse                          // Mouse script interface
runtime.keyboard                       // Keyboard script interface
runtime.touch                          // Touch script interface
runtime.timelineController             // Timeline Controller script interface
runtime.platformInfo                   // IPlatformInfo (always available)
runtime.collisions                     // ICollisionEngine
runtime.renderer                       // IRenderer — use only in draw events (or for texture loading)
runtime.assets                         // IAssetManager
runtime.storage                        // IStorage

// Layout
runtime.layout                         // ILayout — current layout
runtime.getLayout(nameOrIndex)          // ILayout — by name (case-insensitive) or zero-based index
runtime.getAllLayouts()                 // ILayout[] — all layouts in project order
runtime.goToLayout(nameOrIndex)         // end current layout and switch (takes effect end of tick)

// Project metadata
runtime.projectId                      // string
runtime.projectName                    // string
runtime.projectUniqueId                // string
runtime.projectVersion                 // string

// Viewport
runtime.viewportWidth                  // number (read-only)
runtime.viewportHeight                 // number (read-only)
runtime.getViewportSize()              // [width, height]

// Loading
runtime.loadingProgress                // 0-1 (loader layout)
runtime.imageLoadingProgress           // 0-1 (memory management Load actions)

// Rendering
runtime.sampling                       // "nearest" | "bilinear" | "trilinear"
runtime.isPixelRoundingEnabled         // boolean
runtime.anisotropicFiltering           // "auto" | "off" | "2x" | "4x" | "8x" | "16x"

// Timing
runtime.gameTime                       // number — in-game seconds (affected by timeScale)
runtime.wallTime                       // number — wall-clock seconds (unaffected by timeScale)
runtime.tickCount                      // number (read-only) — ticks since project started
runtime.timeScale                      // get/set — 1.0=normal, 0=paused
runtime.dt                             // delta-time in seconds
runtime.dtRaw                          // wall-clock delta-time (unaffected by timeScale or clamping)
runtime.minDt                          // min clamping for dt
runtime.maxDt                          // max clamping for dt (default 1/30)
runtime.framerateMode                  // "vsync" | "fixed" | "unlimited-tick" | "unlimited-frame"
runtime.fixedFramerate                 // target FPS when framerateMode is "fixed"
runtime.framesPerSecond                // number (read-only)
runtime.ticksPerSecond                 // number (read-only)
runtime.cpuUtilisation                 // 0-1 estimate
runtime.gpuUtilisation                 // 0-1 estimate (NaN if unsupported)
runtime.isSuspended                    // boolean (read-only)
runtime.exportDate                     // Date object — when the project was exported

// Control flow
runtime.callFunction(name, ...params)  // call event sheet function; returns return value or null
runtime.setReturnValue(value)          // set return value inside an event-sheet function script
runtime.signal(tag)                    // trigger On signal / resolve waitForSignal()
await runtime.waitForSignal(tag)       // Promise resolving when tag is signalled
runtime.random()                       // random [0,1) — deterministic if Advanced Random overrides it

// Destroying / sorting instances
runtime.destroyMultiple(iterable)      // efficiently destroy many instances at once
runtime.sortZOrder(iterable, callback) // custom Z-sort; callback receives (a, b) IWorldInstance
// example: runtime.sortZOrder(runtime.objects.Sprite.instances(), (a, b) => a.instVars.z - b.instVars.z)

// Screenshot
runtime.saveCanvasImage(format?, quality?, areaRect?)  // → Promise<Blob>

// Download
runtime.invokeDownload(url, filename)

// DOM / HTML
runtime.isInWorker                     // boolean — true when running in a Web Worker
runtime.getHTMLLayer(index)            // HTMLElement — DOM mode only, throws in worker mode
await runtime.alert(message)          // async alert (forwards to DOM in worker mode)

// SDK only
runtime.sdk                            // ISDKUtils
```

### Key patterns

```js
// Listening for layout changes
runtime.addEventListener("beforeanylayoutstart", (e) => {
  console.log("Starting layout:", e.layout.name);
});

// Custom save data
runtime.addEventListener("save", (e) => { e.saveData = { score: myScore }; });
runtime.addEventListener("load", (e) => { myScore = e.saveData?.score ?? 0; });

// Sorting Z order
runtime.sortZOrder(
  runtime.objects.Sprite.instances(),
  (a, b) => a.instVars.myZOrder - b.instVars.myZOrder
);
```

---

## 49. ILOSBehaviorInstance Script Interface

`ILOSBehaviorInstance` derives from `IBehaviorInstance`. Access via `inst.behaviors.LineOfSight` (or whatever the behavior is named).

### APIs

```js
losInst.range            // get/set — maximum distance in pixels for LOS detection
losInst.coneOfView       // get/set — cone angle in radians (relative to object angle)

losInst.addObstacle(iObjectClass)    // add an IObjectClass as a LOS obstacle (Custom obstacles mode only)
                                     // Note: affects the entire behavior, not just this instance
losInst.clearObstacles()             // clear all added obstacles (Custom obstacles mode only)
                                     // Note: affects the entire behavior, not just this instance

losInst.hasLOStoPosition(x, y)       // → boolean — respects range and cone of view
losInst.hasLOSBetweenPositions(fromX, fromY, fromAngle, toX, toY)
                                     // → boolean — LOS between two arbitrary positions
                                     //   fromAngle in radians, respects range and cone

losInst.castRay(fromX, fromY, toX, toY, useCollisionCells = true)
                                     // → ILOSBehaviorRay — ignores range and cone of view
losInst.ray                          // ILOSBehaviorRay — result of the last castRay() call
```

### ILOSBehaviorRay Interface

Returned by `castRay()`. All properties are read-only.

```js
ray.didCollide           // boolean — true if an obstacle was hit

// Only valid if didCollide is true:
ray.hitX                 // number — hit position X in layout co-ordinates
ray.hitY                 // number — hit position Y in layout co-ordinates
ray.getHitPosition()     // → [hitX, hitY]
ray.hitDistance          // number — distance from ray start to hit
ray.hitUid               // number — UID of the obstacle instance that was hit

ray.getNormalX(length)   // position along surface normal at given distance
ray.getNormalY(length)
ray.getNormal(length)    // → [x, y]
ray.normalAngle          // radians — surface normal angle at hit point

ray.getReflectionX(length)  // position along reflection vector at given distance
ray.getReflectionY(length)
ray.getReflection(length)   // → [x, y]
ray.reflectionAngle          // radians — reflection angle at hit point
```

### Example

```js
const los = sprite.behaviors.LineOfSight;
const result = los.castRay(sprite.x, sprite.y, targetX, targetY);
if (result.didCollide) {
  console.log(`Hit at (${result.hitX}, ${result.hitY}), distance ${result.hitDistance}`);
  console.log(`Reflected at angle ${result.reflectionAngle} rad`);
}
```

---

## 50. ISineBehaviorInstance Script Interface

`ISineBehaviorInstance` derives from `IBehaviorInstance`. Access via `inst.behaviors.Sine`.

### APIs

```js
sineInst.movement    // get/set — string: "horizontal" | "vertical" | "forwards-backwards"
                     //           "size" | "width" | "height" | "angle" | "opacity"
                     //           "z-elevation" | "value-only"

sineInst.wave        // get/set — string: "sine" | "triangle" | "sawtooth"
                     //           "reverse-sawtooth" | "square"

sineInst.period      // get/set — duration in seconds for one complete cycle
sineInst.magnitude   // get/set — max change in position/size (px) or angle (radians)
sineInst.phase       // get/set — progress through cycle [0, 2π]

sineInst.value       // number (read-only) — current offset value; useful in "value-only" mode

sineInst.updateInitialState()
// Resets the behavior's recorded initial state to the object's current state.
// Use this after moving/resizing the object so the sine oscillates relative to the new state.

sineInst.isEnabled   // boolean — get/set; when false the behavior has no effect
```

---

## 51. IAdvancedRandomObjectType Script Interface

`IAdvancedRandomObjectType` derives from `IObjectClass` (not an instance interface). Access via `runtime.objects.AdvancedRandom`.

### APIs

```js
// Seed
advRand.seed         // get/set string — same seed → same random sequence

// Coherent noise
advRand.octaves      // get/set number [1-16] — detail layers for Billow, Classic, Ridged noise

advRand.billow2d(x, y)           // → number [0-1]
advRand.billow3d(x, y, z)        // → number [0-1]
advRand.cellular2d(x, y)         // → number [0-1]
advRand.cellular3d(x, y, z)      // → number [0-1]
advRand.classic2d(x, y)          // → number [0-1] (Perlin noise)
advRand.classic3d(x, y, z)       // → number [0-1]
advRand.ridged2d(x, y)           // → number [0-1]
advRand.ridged3d(x, y, z)        // → number [0-1]
advRand.voronoi2d(x, y)          // → number [0-1]
advRand.voronoi3d(x, y, z)       // → number [0-1]

// Seeded random
advRand.random()                 // → number [0, 1) — uses current seed (deterministic)

// Gradient APIs
advRand.createGradient(name, mode)      // mode: "float" | "rgb"
advRand.setCurrentGradient(name)
advRand.addGradientStop(position, value)
advRand.sampleGradient(name, position)  // name: string or null (uses current gradient)

// Probability table APIs
advRand.createProbabilityTable(name)
advRand.createProbabilityTableFromJSON(name, jsonStr)
advRand.getProbabilityTableAsJSON()      // → string — serialize current table
advRand.setCurrentProbabilityTable(name)
advRand.addProbabilityTableEntry(weight, value)
advRand.removeProbabilityTableEntry(weight, value)  // weight=0 removes first match by value
advRand.sampleProbabilityTable(name)    // name: string or null (uses current table)

// Permutation table APIs
advRand.createPermutationTable(length, offset)  // randomly ordered sequence of numbers
advRand.shufflePermutationTable()               // re-shuffle existing table
advRand.getPermutation(index)                   // → number at zero-based index
```

---

## 52. I9PatchInstance Script Interface

`I9PatchInstance` derives from `IWorldInstance`. Access via instances of the 9-Patch object.

### APIs

```js
// Margins (apply to the source image, ignoring imageScale; affect all instances by default)
inst9.leftMargin    // get/set — left margin in pixels
inst9.rightMargin   // get/set — right margin in pixels
inst9.topMargin     // get/set — top margin in pixels
inst9.bottomMargin  // get/set — bottom margin in pixels

// After replaceImage() the instance uses its own unique patch images and margins can be
// changed independently without affecting other instances.

inst9.edges         // get/set — "tile" | "stretch"
inst9.fill          // get/set — "tile" | "stretch" | "transparent"
inst9.seams         // get/set — "exact" | "overlap"
inst9.imageScaleX   // get/set — scale factor (1 = 100%)
inst9.imageScaleY   // get/set — scale factor (1 = 100%)

await inst9.replaceImage(blob)
// Replace image from a Blob (e.g. fetched from a URL).
// After this resolves, margin changes only affect this specific instance.
// Example:
//   const resp = await fetch(url);
//   const blob = await resp.blob();
//   await inst9.replaceImage(blob);
//   inst9.leftMargin = 20;  // now safe to modify independently
```

---

## 53. I3DCameraObjectType Script Interface

`I3DCameraObjectType` derives from `IObjectClass` (not an instance interface). Access via `runtime.objects["3DCamera"]` (starts with a digit — not a valid JS identifier). Rename the object to e.g. `Camera3D` for convenience.

### APIs

```js
cam.lookAtPosition(camX, camY, camZ, lookX, lookY, lookZ, upX, upY, upZ)
// Set camera position, look-at point, and up vector.
// Default up vector: (0, 1, 0) for top-down view.

cam.lookParallelToLayout(camX, camY, camZ, lookAngle)
// Set camera position and angle (radians) looking along the layout floor.
// Equivalent to lookAtPosition with up vector (0, 0, 1).

cam.restore2DCamera()
// Restore standard 2D scrolling behavior.

cam.moveAlongLayoutAxis(distance, axis, which)
// Move along a layout-relative axis. distance can be negative.
// axis: "x" | "y" | "z"   which: "camera" | "look" | "both"

cam.moveAlongCameraAxis(distance, axis, which)
// Move along a camera-relative axis. distance can be negative.
// axis: "forward" | "up" | "right"   which: "camera" | "look" | "both"

cam.rotateCamera(rotateX, rotateY, minPolar, maxPolar)
// Rotate camera look-at position (all values in radians).
// Requires lookAtPosition() or lookParallelToLayout() to have been called first.
// min/maxPolar limits vertical rotation.

cam.getCameraPosition()  // → [x, y, z]
cam.getLookPosition()    // → [x, y, z]
cam.getLookVector()      // → [x, y, z] — direction camera points (includes rotation)
cam.getForwardVector()   // → [x, y, z] — camera forward unit vector (no rotation)
cam.getRightVector()     // → [x, y, z] — camera right unit vector (perpendicular to forward)
cam.getUpVector()        // → [x, y, z] — camera up vector (recomputed from position/look)

cam.zScale               // number (read-only) — pixels per unit on the Z axis
cam.fieldOfView          // get/set — angle in radians (only affects "Regular" Z axis scale mode)
```

---

## 54. IFileSystemObjectType Script Interface

`IFileSystemObjectType` derives from `IObjectClass`. Access via `runtime.objects.FileSystem`.

### Accept Types Format

```js
// Used in showSaveFilePicker / showOpenFilePicker
{
  description: "Images",
  accept: {
    "image/*": [".png", ".jpg", ".webp", ".avif"]
  }
}
```

### Start In Locations

String values: `"default"` | `"desktop"` | `"documents"` | `"downloads"` | `"music"` | `"pictures"` | `"videos"`

### File System Event

```js
fs.addEventListener("drop", (e) => {
  // e.files — array of File objects dropped into the window
});
```

### APIs

```js
fs.isSupported                   // boolean (read-only) — File System Access API available
fs.desktopFeaturesSupported      // boolean (read-only) — desktop-specific features available

fs.hasPickerTag(pickerTag)       // boolean — tag remembered or known folder available

// File/folder pickers (all async, resolve with array of selected path strings)
await fs.showSaveFilePicker(opts)
await fs.showOpenFilePicker(opts)
await fs.showFolderPicker(opts)
// opts properties:
//   pickerTag (required): string identifier for this picker session
//   acceptTypes: array of Accept type objects
//   showAcceptAll: boolean
//   suggestedName: string (save picker only)
//   multiple: boolean (open picker only)
//   id: string (remembers last folder)
//   startIn: Start in location string
//   mode: "read" | "readwrite" (folder picker only)

// File I/O (all async)
await fs.writeFile({ pickerTag, data, folderPath?, mode?, fileTag? })
// data: string (UTF-8) or ArrayBuffer
// mode: "overwrite" (default) | "append" (text only)

await fs.readFile({ pickerTag, mode, folderPath?, fileTag? })
// mode: "text" → resolves with string | "binary" → resolves with ArrayBuffer

await fs.createFolder(pickerTag, folderPath, fileTag?)
await fs.copyFile(pickerTag, srcFolderPath, destFolderPath, fileTag?)
await fs.moveFile(pickerTag, srcFolderPath, destFolderPath, fileTag?)
await fs.delete(pickerTag, folderPath, isRecursive, fileTag?)

await fs.listContent(pickerTag, folderPath, isRecursive, fileTag?)
// Resolves with { files: string[], folders: string[] }
// Recursive names may include forward-slash separators

// Desktop-only (requires desktopFeaturesSupported === true)
await fs.shellOpen(pickerTag, filePath, fileTag?)
await fs.runFile(pickerTag, filePath, args?, fileTag?)
// pickerTag can be "" to run system executables directly (e.g. "cmd.exe")
```

---

## 55. IFileChooserInstance Script Interface

`IFileChooserInstance` derives from `IDOMInstance`.

### Events

```js
inst.addEventListener("change", () => {
  // Files have been chosen — call getFiles() here
});
```

### APIs

```js
inst.click()     // Programmatically open the system file picker (requires user gesture)
inst.clear()     // Reset to initial state, clearing any selection
inst.getFiles()  // → File[] — currently chosen files
```

---

## 56. IDrawingCanvasInstance Script Interface

`IDrawingCanvasInstance` derives from `IWorldInstance`.

### Colors

Pass colors as `[r, g, b]` (opaque) or `[r, g, b, a]` (with alpha). Each component is `0–1`.

### Events

```js
inst.addEventListener("resolutionchange", () => {
  // Canvas resolution changed (same as On resolution changed trigger)
});
```

### APIs

```js
// Clear
inst.clearCanvas(color)
inst.clearRect(left, top, right, bottom, color)

// Fill shapes
inst.fillRect(left, top, right, bottom, color)
inst.outlineRect(left, top, right, bottom, color, thickness)
inst.fillLinearGradient(left, top, right, bottom, color1, color2, direction = "horizontal")
// direction: "horizontal" | "vertical"

inst.fillEllipse(x, y, radiusX, radiusY, color, isSmooth = true)
inst.outlineEllipse(x, y, radiusX, radiusY, color, thickness, isSmooth = true)

// Lines
inst.line(x1, y1, x2, y2, color, thickness, lineCap = "butt")
inst.lineDashed(x1, y1, x2, y2, color, thickness, dashLength, lineCap = "butt")
// lineCap: "butt" | "square"

// Polygons — polyPoints is [[x1,y1], [x2,y2], ...]
inst.fillPoly(polyPoints, color, isConvex = false)
inst.linePoly(polyPoints, color, thickness, lineCap = "butt")
inst.lineDashedPoly(polyPoints, color, thickness, dashLength, lineCap = "butt")
// isConvex: skip concave decomposition (faster, but only correct for convex shapes)
// Note: self-intersecting polygons not supported by fillPoly

// Blend mode
inst.setDrawBlend(blendMode)
// blendMode: "normal" | "additive" | "copy" | "destination-over" | "source-in"
//            "destination-in" | "source-out" | "destination-out" | "source-atop" | "destination-atop"

// Paste instances onto canvas
await inst.pasteInstances(instancesArr, includeEffects = true)
// Paste happens at end of tick — await to ensure completion before using result

// Resolution mode
inst.setFixedResolutionMode(fixedWidth, fixedHeight)
inst.setAutoResolutionMode()

// Surface info (read-only)
inst.surfaceDeviceWidth    // number — rendering surface width in device pixels
inst.surfaceDeviceHeight   // number — rendering surface height in device pixels
inst.getSurfaceDeviceSize() // → [width, height]
inst.pixelScale            // number — size of one canvas pixel in object co-ordinates

// Pixel data
await inst.getImagePixelData()  // → ImageData (unpremultiplied alpha)
inst.loadImagePixelData(imageData, premultiplyAlpha = false)
// imageData must be exactly surfaceDeviceWidth × surfaceDeviceHeight
// premultiplyAlpha: set true if source data is not already premultiplied

// Save canvas
inst.saveImage(format?, quality?, areaRect?)  // → Promise<Blob>
// format: MIME type e.g. "image/png" | "image/jpeg"
// quality: 0-1 (lossy formats only)
// areaRect: DOMRect in device pixels (subset of canvas)
```

---

## 57. ISpriteInstance Script Interface

`ISpriteInstance` derives from `IWorldInstance`. `ISpriteObjectType` derives from `IObjectClass` and provides object-type-level animation APIs.

### Sprite Instance Events

```js
inst.addEventListener("framechange", (e) => {
  e.animationName   // string — currently playing animation
  e.animationFrame  // number — zero-based new frame index
});

inst.addEventListener("animationend", (e) => {
  e.animationName   // string — animation that finished
});
```

### Sprite Instance APIs

```js
// Animation state
sprInst.animation              // IAnimation — current animation (read-only object)
sprInst.animationName          // string (read-only) — use setAnimation() to change

sprInst.setAnimation(name, from = "beginning")
// name is case-insensitive; throws if not found
// from: "beginning" | "current-frame"
// Note: does nothing if animation is already playing; use startAnimation("beginning") to restart

sprInst.getAnimation(name)     // → IAnimation | null — by case-insensitive name

sprInst.startAnimation(from = "current-frame")  // start/restart playback
// from: "beginning" | "current-frame"
sprInst.stopAnimation()        // stop playback

sprInst.animationFrame         // get/set — zero-based current frame index
sprInst.animationFrameTag      // get/set — tag string of current frame ("" if not set)
                               // Setting a tag jumps to the first matching frame

sprInst.animationSpeed         // get/set — playback speed in frames per second
sprInst.animationRepeatToFrame // get/set — frame index to rewind to on repeat

// Image info
sprInst.imageWidth             // number (read-only)
sprInst.imageHeight            // number (read-only)
sprInst.getImageSize()         // → [width, height]

// Image points (index 0 = origin; first user point = index 1)
sprInst.getImagePointCount()   // → number
sprInst.getImagePointX(nameOrIndex)   // → layout X co-ordinate
sprInst.getImagePointY(nameOrIndex)   // → layout Y co-ordinate
sprInst.getImagePointZ(nameOrIndex)   // → layout Z co-ordinate (useful with mesh distortion)
sprInst.getImagePoint(nameOrIndex)    // → [x, y, z]
// Returns origin position if not found

// Collision polygon (layout co-ordinates)
sprInst.getPolyPointCount()    // → number
sprInst.getPolyPointX(index)   // → layout X
sprInst.getPolyPointY(index)   // → layout Y
sprInst.getPolyPoint(index)    // → [x, y]
// Note: first poly point is repeated at index getPolyPointCount() for easy edge iteration

// Solid collision filter
sprInst.setSolidCollisionFilter(isInclusive, tags)
// isInclusive=true → only collide with solids matching tags (pass empty tags to collide with none)
// isInclusive=false → collide with all solids EXCEPT those matching tags (default: all solids)
// tags: space-separated string or any iterable of strings

// Replace current frame image
await sprInst.replaceCurrentAnimationFrame(blob)
// blob can be locally generated or fetched from a URL
```

### Sprite Object Type APIs

These live on the object type (e.g. `runtime.objects.MySprite`), not on instances. Changes affect **all instances**.

```js
const sprObjType = runtime.objects.MySprite;  // ISpriteObjectType

sprObjType.getAnimation(name)    // → IAnimation | null — case-insensitive name lookup
sprObjType.getAllAnimations()    // → IAnimation[] — all animations

sprObjType.addAnimation(animName)
// → IAnimation — adds new animation with single 100×100 transparent frame; name must be unique

sprObjType.removeAnimation(animName)
// Throws if name doesn't exist or it's the last animation

sprObjType.addAnimationFrame(animName, where)
// Inserts a 100×100 transparent frame at position where:
//   number → zero-based index (-1 = end)
//   string → animation frame tag (inserts before first matching tag)
// → IAnimationFrame

sprObjType.removeAnimationFrame(animName, where)
// where: number index (-1 = last) or tag string
// Cannot remove the last frame
```

---

## 58. ITilemapInstance Script Interface

`ITilemapInstance` derives from `IWorldInstance`.

### Tile Number Format

Tile numbers are 32-bit integers composed of a tile ID (lower 29 bits) and flags (upper 3 bits). `-1` is an empty tile.

```js
// Tile flag constants (access on the class or instance)
ITilemapInstance.TILE_FLIPPED_HORIZONTAL = -0x80000000
ITilemapInstance.TILE_FLIPPED_VERTICAL   =  0x40000000
ITilemapInstance.TILE_FLIPPED_DIAGONAL   =  0x20000000
ITilemapInstance.TILE_FLAGS_MASK         =  0xE0000000
ITilemapInstance.TILE_ID_MASK            =  0x1FFFFFFF

// Examples:
const flippedH = 2 | ITilemapInstance.TILE_FLIPPED_HORIZONTAL
const tileId   = tile & ITilemapInstance.TILE_ID_MASK
const isFlipH  = (tile & ITilemapInstance.TILE_FLIPPED_HORIZONTAL) !== 0
// Always check tile !== -1 before applying masks (empty tile is a special value)
```

### APIs

```js
// Map size in tiles
tmInst.mapWidth              // number (read-only)
tmInst.mapHeight             // number (read-only)
tmInst.getMapSize()          // → [mapWidth, mapHeight]

// Display size (may differ from map size if resized smaller at runtime)
tmInst.mapDisplayWidth       // number (read-only)
tmInst.mapDisplayHeight      // number (read-only)
tmInst.getMapDisplaySize()   // → [mapDisplayWidth, mapDisplayHeight]

// Tile dimensions in pixels
tmInst.tileWidth             // number (read-only)
tmInst.tileHeight            // number (read-only)
tmInst.getTileSize()         // → [tileWidth, tileHeight]

// Tile access (tile co-ords: 0,0 = top-left tile regardless of position/size)
tmInst.getTileAt(x, y)       // → number — tile number or -1 for empty/out-of-bounds
tmInst.setTileAt(x, y, tile) // set tile (-1 = empty; use bit operations for ID+flags)

// Replace tileset image
await tmInst.replaceImage(blob)
```

---

## 59. ITiledBackgroundInstance Script Interface

`ITiledBackgroundInstance` derives from `IWorldInstance`.

### APIs

```js
// Source image dimensions (not the tiled display size)
tbInst.imageWidth            // number (read-only)
tbInst.imageHeight           // number (read-only)
tbInst.getImageSize()        // → [imageWidth, imageHeight]

// Tile offset (in pixels)
tbInst.imageOffsetX          // get/set
tbInst.imageOffsetY          // get/set
tbInst.setImageOffset(x, y)
tbInst.getImageOffset()      // → [imageOffsetX, imageOffsetY]

// Tile scale (1 = original size)
tbInst.imageScaleX           // get/set
tbInst.imageScaleY           // get/set
tbInst.setImageScale(x, y)
tbInst.getImageScale()       // → [imageScaleX, imageScaleY]

// Tile angle
tbInst.imageAngle            // get/set — radians (updating this also updates imageAngleDegrees)
tbInst.imageAngleDegrees     // get/set — degrees (updating this also updates imageAngle)

// Tile randomization
tbInst.enableTileRandomization  // boolean get/set

tbInst.tileXRandom           // get/set — horizontal random offset, 0-1 percentage
tbInst.tileYRandom           // get/set — vertical random offset, 0-1 percentage
tbInst.setTileRandom(x, y)
tbInst.getTileRandom()       // → [tileXRandom, tileYRandom]

tbInst.tileAngleRandom       // get/set — random rotation amount, 0-1 percentage

// Blend margin
tbInst.tileBlendMarginX      // get/set — horizontal blend margin, 0-1 percentage
tbInst.tileBlendMarginY      // get/set — vertical blend margin, 0-1 percentage
tbInst.setTileBlendMargin(x, y)
tbInst.getTileBlendMargin()  // → [tileBlendMarginX, tileBlendMarginY]

// Replace image
await tbInst.replaceImage(blob)
```
