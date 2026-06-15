export const config = {
  returnType: "number",
  description: "Current max wave height cap in pixels (displacement from rest, either direction). 0 means the cap is disabled.",
  params: [],
};

export const expose = true;

export default function () {
  return this._maxWaveHeight;
}
