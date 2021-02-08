// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

Vue.config.productionTip = false

import rem from './rem.js'
rem(16)
import fastclick from 'fastclick'
fastclick.attach(document.body)

import {Button, Popup, Icon, Switch, Slider,Progress,Circle,Loading} from 'vant'
Vue.use(Button)
.use(Popup)
.use(Icon)
.use(Switch)
.use(Slider)
.use(Circle)
.use(Progress)
.use(Loading);
import axios from 'axios'
Vue.prototype.$http = axios

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
