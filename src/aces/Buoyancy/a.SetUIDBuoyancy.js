export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set UID buoyancy",
  displayText: "Set UID buoyancy {1} for {0} to {2}",
  description: "Sets one Physics splash setting for a single instance UID.",
  params: [
    {
      id: "uid",
      name: "UID",
      desc: "Target instance UID.",
      type: "number",
      initialValue: "0",
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

export default function (uid, setting, value) {
  this._setInstanceBuoyancyValue(uid, this._getBuoyancySettingKey(setting), value);
}