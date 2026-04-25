export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set auto-waves enabled",
  displayText: "Set auto-waves enabled to {0}",
  description: "Enables or disables auto-wave oscillation.",
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "True to enable auto-waves.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = true;

export default function (enabled) {
  this._autowavesEnabled = enabled;
  if (enabled && !this._isTicking()) this._setTicking(true);
}
