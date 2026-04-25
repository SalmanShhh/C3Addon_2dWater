export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set Physics auto-force enabled",
  displayText: "Set Physics auto-force enabled to {0}",
  description: "Enables or disables Physics auto-force detection. Disabling clears tracked instances.",
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "True to enable.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = true;

export default function (enabled) {
  this._autoPhysicsForce = enabled;
  if (!enabled) this._physicsTracked.clear();
}
