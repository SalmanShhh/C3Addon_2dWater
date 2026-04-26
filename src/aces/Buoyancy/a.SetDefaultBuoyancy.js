export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set default buoyancy",
  displayText: "Set default buoyancy {0} to {1}",
  description: "Sets one fallback Physics splash setting used when no object-type default or UID override is set.",
  params: [
    {
      id: "setting",
      name: "Setting",
      desc: "Which buoyancy setting to change.",
      type: "combo",
      initialValue: "force_multiplier",
      items: [
        { force_multiplier: "Force multiplier" },
        { surface_radius: "Surface radius" },
      ],
    },
    {
      id: "value",
      name: "Value",
      desc: "New value for the selected buoyancy setting.",
      type: "number",
      initialValue: "1.0",
    },
  ],
};

export const expose = true;

export default function (setting, value) {
  this._setDefaultBuoyancyValue(setting, value);
}