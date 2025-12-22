import { createApp } from 'vue'
import './style.css'
import App from './App.vue'



import { Quasar } from 'quasar'

// Import icon libraries
import '@quasar/extras/bootstrap-icons/bootstrap-icons.css'

// A few examples for animations from Animate.css:
// import @quasar/extras/animate/fadeIn.css
// import @quasar/extras/animate/fadeOut.css

// Import Quasar css
import 'quasar/src/css/index.sass'


const myApp = createApp(App)

myApp.use(Quasar, {
    config:{
        dark:'auto'
    },
  plugins: {}, // import Quasar plugins and add here
})

// Assumes you have a <div id="app"></div> in your index.html
myApp.mount('#app')
