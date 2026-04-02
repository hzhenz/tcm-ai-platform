import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import * as ElIcons from "@element-plus/icons-vue";

// 👇 新增这行：引入 Element Plus 组件库
import ElementPlus from 'element-plus'
// 👇 新增这行：引入 Element Plus 的全局 CSS 样式（不加这行组件会没有样式）
import 'element-plus/dist/index.css'
import router from "./router/index.js"
// import store from './store/index.js'

// createApp(App).mount('#app')
const xapp= createApp(App);

for (const name in ElIcons) {
    xapp.component(name, ElIcons[name]);
}

xapp.use(ElementPlus);
xapp.use(router);
// xapp.use(store);
xapp.mount('#app');