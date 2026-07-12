// const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config}*/
const config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],

  theme: {
    extend: {},
  },

  // plugins: [
  //     plugin( function ({addVariant, e}) {
  //       addVariant('pip', "[data-pip=\"true\"] &");
  //       addVariant('notpip', ":not([data-pip=\"true\"]) &");
  //     })
  // ],
};

module.exports = config;
