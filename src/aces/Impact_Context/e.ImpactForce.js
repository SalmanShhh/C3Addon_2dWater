export const config = {
  returnType: "number",
  description: "The computed force applied to the surface. Valid inside OnPhysicsImpact only.",
  params: [],
};

export const expose = true;

export default function () {
  return this._impactForce;
}
