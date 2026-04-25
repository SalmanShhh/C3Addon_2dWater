export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set spread",
  displayText: "Set spread to {0}",
  description: "Sets the lateral propagation rate at runtime.",
  params: [
    {
      id: "spread",
      name: "Spread",
      desc: "Lateral propagation rate.",
      type: "number",
      initialValue: "0.25",
    },
  ],
};

export const expose = true;

export default function (spread) {
  this._spread = spread;
}
