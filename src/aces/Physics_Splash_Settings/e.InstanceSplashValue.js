export const config = {
  returnType: "number",
  description: "Returns the effective splash setting value for the given UID, resolving UID override first, then object-type override, then water default. Does not require the Physics behavior to query.",
  params: [
    {
      id: "uid",
      name: "UID",
      desc: "Target instance UID.",
      type: "number",
    },
    {
      id: "setting",
      name: "Setting",
      desc: "Which splash setting to return: force_multiplier or surface_radius.",
      type: "string",
    },
  ],
};

export const expose = true;

export default function (uid, setting) {
  return this._getResolvedBuoyancyValue(this._resolveBuoyancySettingsForUID(uid), setting);
}
