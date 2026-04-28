export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set enabled",
  displayText: "Set enabled to {0}",
  description:
    "Enables or disables the water behavior. When disabled, the simulation is paused and ticking stops.",
  params: [
    {
      id: "enabled",
      name: "Enabled",
      desc: "True to enable the behavior, false to disable it.",
      type: "boolean",
      initialValue: "true",
    },
  ],
};

export const expose = true;

export default function (enabled) {
  this.enabled = enabled;
}
