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

export const expose = true;

export default function (x) {
  if (!this.instance) return 0;
  const bbox = this.instance.getBoundingBox();
  if (x < bbox.left || x > bbox.right) return bbox.top;
  const colWidth = this.instance.width / (this._meshColumns - 1);
  const col = Math.max(0, Math.min(this._meshColumns - 1, Math.round((x - bbox.left) / colWidth)));
  return this._displayY[col];
}