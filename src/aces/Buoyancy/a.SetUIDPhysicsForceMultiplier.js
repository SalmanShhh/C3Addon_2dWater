export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set UID force multiplier",
  displayText: "Set UID force multiplier for {0} to {1}",
  description: "Sets the Physics force multiplier for one instance UID.",
  params: [
    {
      id: "uid",
      name: "UID",
      desc: "Target instance UID.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "multiplier",
      name: "Multiplier",
      desc: "Physics force multiplier for this UID.",
      type: "number",
      initialValue: "1.0",
    },
  ],
};

export const expose = true;

export default function (uid, multiplier) {
  this._setInstanceBuoyancyValue(uid, "forceMultiplier", multiplier);
}