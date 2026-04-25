export const config = {
  highlight: false,
  deprecated: false,
  isTrigger: false,
  isInvertible: true,
  listName: "Is auto-waves enabled",
  displayText: "Auto-waves is enabled",
  description: "True if auto-wave oscillation is currently active.",
  params: [],
};

export const expose = false;

export default function () {
  return this._autowavesEnabled;
}
