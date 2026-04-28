export const config = {
  returnType: "number",
  description: "Current fixed simulation step in seconds.",
  params: [],
};

export const expose = true;

export default function () {
  return this._fixedSimStepSeconds;
}
