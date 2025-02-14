import { createApp } from 'vue'
import App from './app.vue'
import 'element-plus/dist/index.css'
import { setupStore } from "@/store";


function initVue() {
  // 创建 Vue 实例并挂载
  // 初始化 Vue 应用
  const app = createApp(App)
  // 全局注册 状态管理(store)
  setupStore(app);
  // 创建挂载点
  const mountEl = document.createElement('div')
  mountEl.id = 'red-note-myplugin-app'
  document.body.appendChild(mountEl)
  // 挂载 Vue 应用
  app.mount('#red-note-myplugin-app')
}

export default initVue
