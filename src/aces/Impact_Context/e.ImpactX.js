export const config = {
  returnType: "number",
  description: "World X coordinate of the Physics impact. Valid inside OnPhysicsImpact only.",
  params: [],
};

export const expose = false;

export default function () {
  return this._impactX;
}
