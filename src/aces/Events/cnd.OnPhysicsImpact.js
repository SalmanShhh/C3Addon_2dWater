export const config = {
  highlight: true,
  deprecated: false,
  isTrigger: true,
  listName: "On Physics impact",
  displayText: "On Physics impact (UID filter: {0})",
  description: "Fires once per Physics instance per surface zone entry. Pass 0 to fire for any impacting instance.",
  params: [
    {
      id: "instanceUID",
      name: "Instance UID",
      desc: "UID to filter for, or 0 for any.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = false;

export default function (instanceUID) {
  // Filter: 0 = any, otherwise match UID
  return instanceUID === 0 || instanceUID === this._impactUID;
}
