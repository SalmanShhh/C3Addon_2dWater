export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Clear UID surface radius",
  displayText: "Clear UID surface radius for {0}",
  description: "Clears the Physics surface radius for one instance UID.",
  params: [
    {
      id: "uid",
      name: "UID",
      desc: "Target instance UID.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (uid) {
  this._clearInstanceBuoyancyValue(uid, "surfaceRadius");
}