import { createWebHistory, createRouter } from 'vue-router'

import Home from './pages/Home.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/gesture-recognition', component: () => import('./pages/HandGestureRecognizer.vue') },
  { path: '/object-detection', component: () => import('./pages/ObjectDetection.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router