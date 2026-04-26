export const config = {
  returnType: "number",
  description: "Effective buoyancy value for the given UID using the hybrid order: UID override, object-type default, then water instance default.",
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
      desc: "Which buoyancy setting to return: force_multiplier or surface_radius.",
      type: "string",
    },
  ],
};

export const expose = true;

export default function (uid, setting) {
  return this._getResolvedBuoyancyValue(this._resolveBuoyancySettingsForUID(uid), setting);
}