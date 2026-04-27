export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set physics auto-splash enabled",
  displayText: "Set physics auto-splash to {0}",
  description: "Enables or disables automatic splash detection. When enabled, the water monitors all objects with the Physics behavior and creates splashes when they enter or exit the water surface. Objects must have the Physics behavior attached to be detected.",
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "True to enable auto-splash detection for Physics-behavior objects.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = true;

export default function (enabled) {
  this._autoPhysicsForce = !!enabled;
  if (this._autoPhysicsForce && !this._isTicking()) this._setTicking(true);
  if (!this._autoPhysicsForce) this._physicsTracked.clear();
}
