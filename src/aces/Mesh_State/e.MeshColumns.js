export const config = {
  returnType: "number",
  description: "Current number of simulation columns.",
  params: [],
};

export const expose = true;

export default function () {
  return this._meshColumns;
}
