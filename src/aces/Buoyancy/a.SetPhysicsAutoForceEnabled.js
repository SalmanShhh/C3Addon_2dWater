export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set auto-force",
  displayText: "Set auto-force to {0}",
  description: "Enables or disables automatic Physics impact detection.",
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "True to enable auto-force.",
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