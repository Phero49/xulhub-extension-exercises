// FILE: main.js

import { createApp } from "vue";
import { ClosePopup, Quasar, TouchHold,Notify } from "quasar";

// Import icon libraries
import "@quasar/extras/material-icons";

// Import Quasar css
import "quasar/src/css/index.sass";

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from "./App.vue";

const myApp = createApp(App);

myApp.use(Quasar, {


  directives:{
TouchHold:TouchHold,
ClosePopup:ClosePopup
  },
  config: {
    
    dark: "auto",

  },
  plugins: {Notify}, // import Quasar plugins and add here
});

// Assumes you have a <div id="app"></div> in your index.html
myApp.mount("#app");
