// FILE: main.js

import { createApp } from 'vue'
import { Quasar } from 'quasar'

// Import Quasar css
import '@quasar/extras/material-icons/material-icons.css'
// Assumes your root component is App.vue
// and placed in same folder as main.js

import 'quasar/src/css/index.sass'
import App from './App.vue'
import './style.css'

const myApp = createApp(App)

myApp.use(Quasar, {
  config:{
dark:'auto'
  },
  plugins: {

  }, // import Quasar plugins and add here
})

// Assumes you have a <div id="app"></div> in your index.html
myApp.mount('#app')
