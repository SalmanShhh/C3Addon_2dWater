export const config = {
  returnType: "number",
  description: "World Y of the water surface at world X position x.",
  params: [
    {
      id: "x",
      name: "X",
      desc: "World X coordinate.",
      type: "number",
    },
  ],
};

export const expose = false;

export default function (x) {
  if (!this._wi) return 0;
  const bbox = this._wi.GetBoundingBox();
  if (x < bbox.left || x > bbox.right) return bbox.top;
  const colWidth = this._wi.GetWidth() / (this._meshColumns - 1);
  const col = Math.max(0, Math.min(this._meshColumns - 1, Math.round((x - bbox.left) / colWidth)));
  return this._displayY[col];
}
