export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set surface radius",
  displayText: "Set surface radius to {0}",
  description: "Sets the base Physics surface radius.",
  params: [
    {
      id: "radius",
      name: "Radius",
      desc: "Base Physics surface radius in pixels.",
      type: "number",
      initialValue: "20",
    },
  ],
};

export const expose = true;

export default function (radius) {
  this._physicsSurfaceRadius = radius;
}