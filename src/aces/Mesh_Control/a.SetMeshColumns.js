export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set mesh columns",
  displayText: "Set mesh columns to {0}",
  description: "Changes the number of simulation columns at runtime. Wave state is resampled. Do not call every tick.",
  params: [
    {
      id: "columns",
      name: "Columns",
      desc: "Number of columns. Values below 2 are clamped to 2.",
      type: "number",
      initialValue: "64",
    },
  ],
};

export const expose = true;

export default function (columns) {
  this._rebuildMesh(columns, this._meshRows);
}
