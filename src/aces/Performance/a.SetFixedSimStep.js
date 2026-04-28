export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set fixed simulation step",
  displayText: "Set fixed simulation step to {0} seconds",
  description: "Sets the fixed simulation step in seconds. Clamped to [1/240FPS, 1/15FPS].",
  params: [
    {
      id: "seconds",
      name: "Seconds",
      desc: "Fixed simulation step size in seconds.",
      type: "number",
      initialValue: "0.0166667",
    },
  ],
};

export const expose = true;

export default function (seconds) {
  this._setFixedSimStepSeconds(seconds);
}
