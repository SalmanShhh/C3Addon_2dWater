export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set instance splash setting",
  displayText: "Set splash setting {1} for UID {0} to {2}",
  description: "Overrides a splash setting for a single instance by UID. Only affects the instance if it has the Physics behavior attached. Takes priority over any object-type or water default.",
  params: [
    {
      id: "uid",
      name: "UID",
      desc: "Target instance UID. The instance must have the Physics behavior attached to be affected.",
      type: "number",
      initialValue: "0",
    },
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

export default function (uid, setting, value) {
  this._setInstanceBuoyancyValue(uid, this._getBuoyancySettingKey(setting), value);
}
