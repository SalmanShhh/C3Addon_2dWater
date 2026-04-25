export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set Physics force multiplier",
  displayText: "Set Physics force multiplier to {0}",
  description: "Sets the velocity-to-force scale factor at runtime.",
  params: [
    {
      id: "multiplier",
      name: "Multiplier",
      desc: "Scale factor.",
      type: "number",
      initialValue: "1.0",
    },
  ],
};

export const expose = true;

export default function (multiplier) {
  this._physicsForceMultiplier = multiplier;
}
