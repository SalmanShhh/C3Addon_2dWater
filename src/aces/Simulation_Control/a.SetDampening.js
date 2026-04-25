export const config = {
  highlight: false,
  deprecated: false,
  isAsync: false,
  listName: "Set dampening",
  displayText: "Set dampening to {0}",
  description: "Sets the energy decay rate at runtime.",
  params: [
    {
      id: "dampening",
      name: "Dampening",
      desc: "Energy decay rate.",
      type: "number",
      initialValue: "0.025",
    },
  ],
};

export const expose = true;

export default function (dampening) {
  this._dampening = dampening;
}
