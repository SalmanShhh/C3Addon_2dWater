export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Clear object-type surface radius",
  displayText: "Clear object-type surface radius for {0}",
  description: "Clears the Physics surface radius for one object type.",
  params: [
    {
      id: "objectTypeName",
      name: "Object type",
      desc: "Object type name.",
      type: "string",
      initialValue: '""',
    },
  ],
};

export const expose = true;

export default function (objectTypeName) {
  this._clearObjectTypeBuoyancyValue(objectTypeName, "surfaceRadius");
}