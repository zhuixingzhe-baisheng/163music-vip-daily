import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ConfigView from '../views/ConfigView.vue'
import TasksView from '../views/TasksView.vue'
import LogsView from '../views/LogsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/config', component: ConfigView },
    { path: '/tasks', component: TasksView },
    { path: '/logs', component: LogsView }
  ]
})

export default router
