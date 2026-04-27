export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set object-type splash setting",
  displayText: "Set splash setting {1} for {0} to {2}",
  description: "Overrides a splash setting for all instances of the chosen object type. Only affects objects that have the Physics behavior attached. Takes priority over the water default but can be overridden per UID.",
  params: [
    {
      id: "objectTypeName",
      name: "Object type",
      desc: "Pick an object type. Instances of this type must have the Physics behavior attached to be affected.",
      type: "object",
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

export default function (objectTypeName, setting, value) {
  this._setObjectTypeBuoyancyValue(
    objectTypeName,
    this._getBuoyancySettingKey(setting),
    value
  );
}
