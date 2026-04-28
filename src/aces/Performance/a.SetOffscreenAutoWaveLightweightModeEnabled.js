export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set off-screen auto-wave lightweight mode",
  displayText: "Set off-screen auto-wave lightweight mode to {0}",
  description: "Performance saver for off-screen water with auto-waves. When enabled, the behavior only advances wave phase and reconstructs the surface directly, skipping spring/spread simulation. Trade-off: hidden ripple dynamics and force interactions are not simulated while this mode is active.",
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "True to enable off-screen auto-wave lightweight mode.",
      type: "boolean",
      initialValue: "false",
    },
  ],
};

export const expose = true;

export default function (enabled) {
  this._setOffscreenAutoWaveLightweightModeEnabled(enabled);
}
