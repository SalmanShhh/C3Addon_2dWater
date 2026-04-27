export const config = {
  returnType: "number",
  description: "Returns the effective splash setting value for the given object type (or its name), applying the object-type override if set, then falling back to the water default. Does not require the Physics behavior to query.",
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
      desc: "Which splash setting to return: force_multiplier or surface_radius.",
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
