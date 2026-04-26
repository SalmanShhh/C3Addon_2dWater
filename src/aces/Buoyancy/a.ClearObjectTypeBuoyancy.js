export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Clear object-type buoyancy",
  displayText: "Clear object-type buoyancy {1} for {0}",
  description: "Clears one Physics splash setting for a picked object type so it falls back to the water default.",
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
      desc: "Which buoyancy setting to clear.",
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