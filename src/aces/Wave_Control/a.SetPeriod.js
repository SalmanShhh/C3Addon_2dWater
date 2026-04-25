export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set period",
  displayText: "Set period to {0}",
  description: "Sets the auto-wave cycle duration in seconds. 0 freezes phase accumulation.",
  params: [
    {
      id: "period",
      name: "Period",
      desc: "Cycle duration in seconds.",
      type: "number",
      initialValue: "2",
    },
  ],
};

export const expose = true;

export default function (period) {
  this._period = period;
}
