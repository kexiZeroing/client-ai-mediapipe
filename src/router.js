import { createWebHistory, createRouter } from 'vue-router'

import Home from './pages/Home.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/gesture-recognition', component: () => import('./pages/HandGestureRecognizer.vue') },
  { path: '/object-detection', component: () => import('./pages/ObjectDetection.vue') },
  { path: '/face-landmark-detection', component: () => import('./pages/FaceLandmarkDetection.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router