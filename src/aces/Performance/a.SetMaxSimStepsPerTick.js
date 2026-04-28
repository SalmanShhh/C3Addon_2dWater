export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set max simulation steps per tick",
  displayText: "Set max simulation steps per tick to {0}",
  description: "Sets the maximum fixed simulation steps processed per tick. Clamped to [1, 20]. Higher values recover from hitches better but can increase per-frame cost.",
  params: [
    {
      id: "steps",
      name: "Steps",
      desc: "Maximum fixed simulation steps processed per tick.",
      type: "number",
      initialValue: "5",
    },
  ],
};

export const expose = true;

export default function (steps) {
  this._setMaxSimStepsPerTick(steps);
}
