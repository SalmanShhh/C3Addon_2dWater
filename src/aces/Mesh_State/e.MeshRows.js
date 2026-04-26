export const config = {
  returnType: "number",
  description: "Current number of mesh rows.",
  params: [],
};

export const expose = true;

export default function () {
  return this._meshRows;
}
