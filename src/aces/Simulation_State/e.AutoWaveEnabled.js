export const config = {
  returnType: "number",
  description: "1 if auto-waves are currently enabled, 0 if disabled.",
  params: [],
};

export const expose = true;

export default function () {
  return this._autowavesEnabled ? 1 : 0;
}
