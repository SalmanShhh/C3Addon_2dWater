export const config = {
  returnType: "number",
  description: "Upward surface normal angle in radians for the water surface at world X position x.",
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
  return this._getSurfaceNormalRadians(x);
}