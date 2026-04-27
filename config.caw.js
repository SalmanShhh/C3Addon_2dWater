import {
  ADDON_CATEGORY,
  ADDON_TYPE,
  PLUGIN_TYPE,
  PROPERTY_TYPE,
} from "./template/enums.js";
import _version from "./version.js";
export const addonType = ADDON_TYPE.BEHAVIOR;
export const type = PLUGIN_TYPE.OBJECT;
export const id = "salmanshh_2dwater";
export const name = "2DWater";
export const version = _version;
export const minConstructVersion = "r450";
export const author = "SalmanShh";
export const website = "https://www.construct.net";
export const documentation = "https://www.construct.net";
export const description = "Interactive 2D water for Sprites and Tiled Backgrounds with ripples, auto-waves, Physics splashes, buoyancy controls, and live surface queries.";
export const category = ADDON_CATEGORY.GENERAL;

export const hasDomside = false;
export const files = {
  extensionScript: {
    enabled: false, // set to false to disable the extension script
    watch: true, // set to true to enable live reload on changes during development
    targets: ["x86", "x64"],
    // you don't need to change this, the build step will rename the dll for you. Only change this if you change the name of the dll exported by Visual Studio
    name: "MyExtension",
  },
  fileDependencies: [],
  remoteFileDependencies: [
    // {
    //   src: "https://example.com/api.js", // Must use https:// or same-protocol // URLs. http:// is not allowed.
    //   type: "" // Optional: "" or "module". Empty string or omit for classic script.
    // }
  ],
  cordovaPluginReferences: [],
  cordovaResourceFiles: [],
};

// categories that are not filled will use the folder name
export const aceCategories = {
  Simulation_Control: "Simulation Control",
  Mesh_Control: "Mesh Control",
  Wave_Control: "Wave Control",
  Physics_Splash_Settings: "Splash Physics Settings",
  Surface_Query: "Surface Query",
  Performance: "Performance",
  Events: "Events",
  State_Checks: "State Checks",
  Mesh_State: "Mesh State",
  Simulation_State: "Simulation State",
  Impact_Context: "Impact Context",
};

export const info = {
  // icon: "icon.svg",
  Set: {
    // COMMON to all
    CanBeBundled: true,
    IsDeprecated: false,
    GooglePlayServicesEnabled: false,

    // BEHAVIOR only
    IsOnlyOneAllowed: true,

    // PLUGIN world only
    IsResizable: false,
    IsRotatable: false,
    Is3D: false,
    HasImage: false,
    IsTiled: false,
    SupportsZElevation: false,
    SupportsColor: false,
    SupportsEffects: false,
    MustPreDraw: false,

    // PLUGIN object only
    IsSingleGlobal: false,
  },
  // PLUGIN only
  AddCommonACEs: {
    Position: false,
    SceneGraph: false,
    Size: false,
    Angle: false,
    Appearance: false,
    ZOrder: false,
  },
};

export const properties = [
  // ── Liquid Physics (indices 0–2) ──────────────────────────────────────────
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "tension",
    name: "Tension",
    desc: "Spring stiffness pulling each column toward its rest height. Low values produce slow, wide waves. High values produce tight, fast ripples.",
    options: { initialValue: 0.025 },
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "dampening",
    name: "Dampening",
    desc: "Energy decay per tick. High values produce thick, viscous water. Low values allow long oscillation.",
    options: { initialValue: 0.025 },
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "spread",
    name: "Spread",
    desc: "Lateral propagation rate between adjacent columns. Controls how fast a disturbance travels horizontally.",
    options: { initialValue: 0.25 },
  },

  // ── Mesh (indices 3–4) ────────────────────────────────────────────────────
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "meshColumns",
    name: "Mesh Columns",
    desc: "Number of simulation columns and mesh control points on the top row. Minimum 2, clamped at init. Can be changed at runtime via SetMeshColumns.",
    options: { initialValue: 64, minValue: 2 },
  },
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "meshRows",
    name: "Mesh Rows",
    desc: "Number of mesh rows. Only row 0 (the top edge) is deformed by the simulation. Minimum 2, clamped at init.",
    options: { initialValue: 2, minValue: 2 },
  },

  // ── Auto-Waves (indices 5–8) ──────────────────────────────────────────────
  {
    type: PROPERTY_TYPE.CHECK,
    id: "autoWaves",
    name: "Enable Auto-Waves",
    desc: "Continuously drives sinusoidal surface motion without any ApplyForce calls. When enabled, idle detection is bypassed.",
    options: { initialValue: false },
  },
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "waveLength",
    name: "Wave Length",
    desc: "Spatial wavelength of auto-waves in pixels.",
    options: { initialValue: 150 },
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "period",
    name: "Period",
    desc: "Time in seconds for one full auto-wave cycle. Setting to 0 freezes phase accumulation.",
    options: { initialValue: 2 },
  },
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "magnitude",
    name: "Magnitude",
    desc: "Amplitude of auto-waves in pixels above the rest surface.",
    options: { initialValue: 2 },
  },

  // ── Physics Auto-Force (indices 9–11) ─────────────────────────────────────
  {
    type: PROPERTY_TYPE.CHECK,
    id: "autoPhysicsForce",
    name: "Auto Physics Splash",
    desc: "When enabled, automatically applies a splash impulse when a Physics-behavior instance overlaps the water object. You can exclude specific instances from auto-splash with the ClearInstanceSplashSetting action.",
    options: { initialValue: true },
  },
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "physicsForceMultiplier",
    name: "Physics Splash Force Multiplier",
    desc: "Scales the impacting instance's velocityY to a splash force magnitude.",
    options: { initialValue: 0.05 },
  },
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "physicsSurfaceRadius",
    name: "Physics Splash Surface Radius",
    desc: "Horizontal splash radius in pixels for Physics auto-impacts.",
    options: { initialValue: 20 },
  },

  // ── Performance (indices 12–13) ───────────────────────────────────────────
  {
    type: PROPERTY_TYPE.FLOAT,
    id: "idleThreshold",
    name: "Idle Threshold",
    desc: "Maximum absolute column speed below which the simulation is considered at rest and ticking halts. 0 disables idle detection. Isn't used when Auto-Waves is enabled.",
    options: { initialValue: 0.01 },
  },
  {
    type: PROPERTY_TYPE.INTEGER,
    id: "spreadPassCount",
    name: "Spread Pass Count",
    desc: "Number of lateral spread iterations per tick. Min 1, max 16. Reduce for background water.",
    options: { initialValue: 7, minValue: 1, maxValue: 16 },
  },
];
