export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set magnitude",
  displayText: "Set magnitude to {0}",
  description: "Sets the auto-wave amplitude in pixels.",
  params: [
    {
      id: "magnitude",
      name: "Magnitude",
      desc: "Amplitude in pixels.",
      type: "number",
      initialValue: "2",
    },
  ],
};

export const expose = true;

export default function (magnitude) {
  this._magnitude = magnitude;
}
