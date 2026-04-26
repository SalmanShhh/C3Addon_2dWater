export const config = {
  returnType: "number",
  description: "Physics force multiplier for the named object type. Falls back to the base water value if no object-type value is set.",
  params: [
    {
      id: "objectTypeName",
      name: "Object type name",
      desc: "Case-insensitive object type name.",
      type: "string",
    },
  ],
};

export const expose = true;

export default function (objectTypeName) {
  return this._resolveBuoyancySettingsForObjectType(objectTypeName).forceMultiplier;
}