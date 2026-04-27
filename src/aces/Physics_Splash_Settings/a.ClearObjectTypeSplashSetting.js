export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Clear object-type splash setting",
  displayText: "Clear splash setting {1} for {0}",
  description: "Removes the object-type override for the chosen setting, reverting to the water default. Only relevant for objects that have the Physics behavior attached.",
  params: [
    {
      id: "objectTypeName",
      name: "Object type",
      desc: "Pick an object type.",
      type: "object",
    },
    {
      id: "setting",
      name: "Setting",
      desc: "Which splash setting to clear.",
      type: "combo",
      initialValue: "force_multiplier",
      items: [
        { force_multiplier: "Force multiplier" },
        { surface_radius: "Surface radius" },
      ],
    },
  ],
};

export const expose = true;

export default function (objectTypeName, setting) {
  this._clearObjectTypeBuoyancyValue(
    objectTypeName,
    this._getBuoyancySettingKey(setting)
  );
}
