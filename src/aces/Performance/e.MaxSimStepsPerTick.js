export const config = {
  returnType: "number",
  description: "Current max fixed simulation steps processed per tick.",
  params: [],
};

export const expose = true;

export default function () {
  return this._maxSimStepsPerTick;
}
