export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set idle threshold",
  displayText: "Set idle threshold to {0}",
  description: "Sets the idle detection speed threshold at runtime. 0 disables idle detection.",
  params: [
    {
      id: "threshold",
      name: "Threshold",
      desc: "Max absolute column speed to be considered idle.",
      type: "number",
      initialValue: "0.01",
    },
  ],
};

export const expose = true;

export default function (threshold) {
  this._idleThreshold = threshold;
}
