export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set object-type surface radius",
  displayText: "Set object-type surface radius for {0} to {1}",
  description: "Sets the Physics surface radius for one object type.",
  params: [
    {
      id: "objectTypeName",
      name: "Object type",
      desc: "Object type name.",
      type: "string",
      initialValue: '""',
    },
    {
      id: "radius",
      name: "Radius",
      desc: "Physics surface radius for this object type.",
      type: "number",
      initialValue: "20",
    },
  ],
};

export const expose = true;

export default function (objectTypeName, radius) {
  this._setObjectTypeBuoyancyValue(objectTypeName, "surfaceRadius", radius);
}