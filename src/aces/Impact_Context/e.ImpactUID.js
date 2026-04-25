export const config = {
  returnType: "number",
  description: "UID of the impacting Physics instance. Valid inside OnPhysicsImpact only.",
  params: [],
};

export const expose = false;

export default function () {
  return this._impactUID;
}
