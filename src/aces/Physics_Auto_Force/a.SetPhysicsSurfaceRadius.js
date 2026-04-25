export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set Physics surface radius",
  displayText: "Set Physics surface radius to {0}",
  description: "Sets the horizontal splash radius for Physics auto-impacts at runtime.",
  params: [
    {
      id: "radius",
      name: "Radius",
      desc: "Horizontal splash radius in pixels.",
      type: "number",
      initialValue: "20",
    },
  ],
};

export const expose = true;

export default function (radius) {
  this._physicsSurfaceRadius = radius;
}
