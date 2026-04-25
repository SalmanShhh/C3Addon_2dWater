export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set mesh rows",
  displayText: "Set mesh rows to {0}",
  description: "Changes the number of mesh rows at runtime. Column simulation state is preserved. Do not call every tick.",
  params: [
    {
      id: "rows",
      name: "Rows",
      desc: "Number of rows. Values below 2 are clamped to 2.",
      type: "number",
      initialValue: "2",
    },
  ],
};

export const expose = true;

export default function (rows) {
  this._rebuildMesh(this._meshColumns, rows);
}
