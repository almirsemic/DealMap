import Vue from 'vue'
import App from './App.vue'
import * as VueGoogleMaps from 'vue2-google-maps'
import { BootstrapVue } from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(BootstrapVue)

Vue.config.productionTip = false


Vue.use(VueGoogleMaps, {
  load: {
    key: 'Add_API_key',
  },
})


new Vue({
  render: h => h(App),
}).$mount('#app')