export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Clear instance splash setting",
  displayText: "Clear splash setting {1} for UID {0}",
  description: "Removes the per-instance override for the chosen setting, falling back to the object-type override or water default. Only relevant if the instance has the Physics behavior attached.",
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

export default function (uid, setting) {
  this._clearInstanceBuoyancyValue(uid, this._getBuoyancySettingKey(setting));
}
