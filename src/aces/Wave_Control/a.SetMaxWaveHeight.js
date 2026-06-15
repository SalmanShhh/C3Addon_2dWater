export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set max wave height",
  displayText: "Set max wave height to {0}",
  description: "Caps how far the surface may displace from rest, in pixels, in either direction. Prevents extreme spikes from large splash forces. Set to 0 to disable the cap.",
  params: [
    {
      id: "maxWaveHeight",
      name: "Max wave height",
      desc: "Maximum surface displacement from rest in pixels (either direction). 0 disables the cap.",
      type: "number",
      initialValue: "0",
    },
  ],
};

export const expose = true;

export default function (maxWaveHeight) {
  this._setMaxWaveHeight(maxWaveHeight);
}
