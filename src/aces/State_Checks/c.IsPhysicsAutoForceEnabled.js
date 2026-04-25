export const config = {
  highlight: false,
  deprecated: false,
  isTrigger: false,
  isInvertible: true,
  listName: "Is Physics auto-force enabled",
  displayText: "Physics auto-force is enabled",
  description: "True if Physics auto-force detection is currently active.",
  params: [],
};

export const expose = false;

export default function () {
  return this._autoPhysicsForce;
}
