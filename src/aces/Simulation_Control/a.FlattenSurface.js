export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Flatten surface",
  displayText: "Flatten surface by {0}%",
  description: "Instantly moves the current surface toward flat by a percentage. 100 fully flattens it; 0 leaves it unchanged.",
  params: [
    {
      id: "percentage",
      name: "Percentage",
      desc: "How much of the current disturbance to remove. Clamped from 0 to 100.",
      type: "number",
      initialValue: "100",
    },
  ],
};

export const expose = true;

export default function (percentage) {
  this._flattenSurfaceInternal(percentage);
}