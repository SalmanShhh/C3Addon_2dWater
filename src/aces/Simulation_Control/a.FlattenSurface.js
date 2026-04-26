export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Flatten surface",
  displayText: "Flatten surface instantly",
  description: "Immediately resets all water columns to the flat rest height and clears their velocity.",
  params: [],
};

export const expose = true;

export default function () {
  this._flattenSurfaceInternal();
}