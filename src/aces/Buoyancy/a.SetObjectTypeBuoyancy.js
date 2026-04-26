export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set object-type buoyancy",
  displayText: "Set object-type buoyancy {1} for {0} to {2}",
  description: "Sets one Physics splash setting for every instance of a picked object type.",
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

export default function (objectTypeName, setting, value) {
  this._setObjectTypeBuoyancyValue(
    objectTypeName,
    this._getBuoyancySettingKey(setting),
    value
  );
}