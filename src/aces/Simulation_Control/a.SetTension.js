export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set tension",
  displayText: "Set tension to {0}",
  description: "Sets the spring constant at runtime.",
  params: [
    {
      id: "tension",
      name: "Tension",
      desc: "Spring stiffness value.",
      type: "number",
      initialValue: "0.025",
    },
  ],
};

export const expose = true;

export default function (tension) {
  this._tension = tension;
}
