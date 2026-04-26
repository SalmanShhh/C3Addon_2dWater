export const config = {
  returnType: "number",
  description: "Effective Physics force multiplier for the given UID using the hybrid order: UID override, object-type default, then water instance default.",
  params: [
    {
      id: "uid",
      name: "UID",
      desc: "Target instance UID.",
      type: "number",
    },
  ],
};

export const expose = true;

export default function (uid) {
  return this._resolveBuoyancySettingsForUID(uid).forceMultiplier;
}