export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set UID surface radius",
  displayText: "Set UID surface radius for {0} to {1}",
  description: "Sets the Physics surface radius for one instance UID.",
  params: [
    {
      id: "uid",
      name: "UID",
      desc: "Target instance UID.",
      type: "number",
      initialValue: "0",
    },
    {
      id: "radius",
      name: "Radius",
      desc: "Physics surface radius for this UID.",
      type: "number",
      initialValue: "20",
    },
  ],
};

export const expose = true;

export default function (uid, radius) {
  this._setInstanceBuoyancyValue(uid, "surfaceRadius", radius);
}