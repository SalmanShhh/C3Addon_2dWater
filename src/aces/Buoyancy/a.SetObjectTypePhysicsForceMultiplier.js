export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set object-type force multiplier",
  displayText: "Set object-type force multiplier for {0} to {1}",
  description: "Sets the Physics force multiplier for one object type.",
  params: [
    {
      id: "objectTypeName",
      name: "Object type name",
      desc: "Case-insensitive object type name.",
      type: "string",
      initialValue: '""',
    },
    {
      id: "multiplier",
      name: "Multiplier",
      desc: "Physics force multiplier for this object type.",
      type: "number",
      initialValue: "1.0",
    },
  ],
};

export const expose = true;

export default function (objectTypeName, multiplier) {
  this._setObjectTypeBuoyancyValue(objectTypeName, "forceMultiplier", multiplier);
}