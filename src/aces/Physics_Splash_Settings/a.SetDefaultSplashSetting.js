export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set default splash setting",
  displayText: "Set default splash setting {0} to {1}",
  description: "Sets the water-wide fallback value for a splash setting. Applies to all objects with the Physics behavior that enter the water, unless overridden per object type or per UID.",
  params: [
    {
      id: "setting",
      name: "Setting",
      desc: "Which splash setting to change.",
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
      desc: "New value for the selected splash setting.",
      type: "number",
      initialValue: "1.0",
    },
  ],
};

export const expose = true;

export default function (setting, value) {
  this._setDefaultBuoyancyValue(setting, value);
}
