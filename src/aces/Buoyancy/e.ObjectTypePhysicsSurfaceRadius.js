export const config = {
  returnType: "number",
  description: "Effective Physics surface radius for the named object type. Falls back to the water instance default when no object-type default is set.",
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
  return this._resolveBuoyancySettingsForObjectType(objectTypeName).surfaceRadius;
}