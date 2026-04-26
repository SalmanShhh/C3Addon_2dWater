export const config = {
  returnType: "number",
  description: "Effective buoyancy value for the given object type or name. Falls back to the water default when no object-type value is set.",
  params: [
    {
      id: "objectTypeName",
      name: "Object type",
      desc: "Object type or object type name.",
      type: "any",
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

export default function (objectTypeName, setting) {
  return this._getResolvedBuoyancyValue(
    this._resolveBuoyancySettingsForObjectType(objectTypeName),
    setting
  );
}