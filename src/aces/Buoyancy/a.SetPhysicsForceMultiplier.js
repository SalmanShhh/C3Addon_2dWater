export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set Physics force multiplier",
  displayText: "Set Physics force multiplier default to {0}",
  description: "Sets the fallback velocity-to-force scale factor used when no object-type default or UID override is set.",
  params: [
    {
      id: "multiplier",
      name: "Multiplier",
      desc: "Base Physics force multiplier.",
      type: "number",
      initialValue: "1.0",
    },
  ],
};

export const expose = true;

export default function (multiplier) {
  this._physicsForceMultiplier = multiplier;
}