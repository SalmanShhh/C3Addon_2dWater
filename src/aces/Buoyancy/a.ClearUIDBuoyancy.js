export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Clear UID buoyancy",
  displayText: "Clear UID buoyancy {1} for {0}",
  description: "Clears one Physics splash setting for a single instance UID so it falls back to the object type or water default.",
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

export default function (uid, setting) {
  this._clearInstanceBuoyancyValue(uid, this._getBuoyancySettingKey(setting));
}