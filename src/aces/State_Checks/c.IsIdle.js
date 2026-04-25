export const config = {
  highlight: false,
  deprecated: false,
  isTrigger: false,
  isInvertible: true,
  listName: "Is idle",
  displayText: "Simulation is idle",
  description: "True if the simulation has stopped ticking due to idle detection.",
  params: [],
};

export const expose = false;

export default function () {
  return !this._isTicking();
}
