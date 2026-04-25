export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set spread pass count",
  displayText: "Set spread pass count to {0}",
  description: "Sets the number of spread pass iterations per tick. Clamped to [1, 16].",
  params: [
    {
      id: "count",
      name: "Count",
      desc: "Number of spread iterations.",
      type: "number",
      initialValue: "7",
    },
  ],
};

export const expose = true;

export default function (count) {
  this._spreadPassCount = Math.max(1, Math.min(16, Math.round(count)));
}
