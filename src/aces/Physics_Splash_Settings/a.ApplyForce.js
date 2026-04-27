export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Apply splash force",
  displayText: "Apply splash force at X {0} with force {1} and radius {2}",
  description: "Applies a vertical impulse to the water surface at a world X coordinate. Does not require any object or Physics behavior — use this to manually trigger splashes from events or script.",
  params: [
    {
      id: "x",
      name: "X",
      desc: "World X coordinate of the impact.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "force",
      name: "Force",
      desc: "Force magnitude. Positive = upward displacement, negative = downward.",
      type: "number",
      initialValue: "-50",
    },
    {
      id: "surface",
      name: "Radius",
      desc: "Horizontal impact radius in pixels.",
      type: "number",
      initialValue: "20",
    },
  ],
};

export const expose = true;

export default function (x, force, surface) {
  this._applyForceInternal(x, force, surface);
}
