export const config = {
  highlight: false,
  deprecated: false,
  isTrigger: false,
  isInvertible: true,
  listName: "Is enabled",
  displayText: "Behavior is enabled",
  description: "True if the water behavior is currently enabled.",
  params: [],
};

export const expose = false;

export default function () {
  return this._enabled;
}
