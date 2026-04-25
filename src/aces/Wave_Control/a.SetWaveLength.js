export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set wave length",
  displayText: "Set wave length to {0}",
  description: "Sets the spatial wavelength of auto-waves in pixels.",
  params: [
    {
      id: "waveLength",
      name: "Wave Length",
      desc: "Spatial wavelength in pixels.",
      type: "number",
      initialValue: "150",
    },
  ],
};

export const expose = true;

export default function (waveLength) {
  this._waveLength = waveLength;
}
