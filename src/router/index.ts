import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/merge',
      name: 'merge',
      component: () => import('../views/MergeView.vue')
    },
    {
      path: '/split',
      name: 'split',
      component: () => import('../views/SplitView.vue')
    },
    {
      path: '/images-to-pdf',
      name: 'images-to-pdf',
      component: () => import('../views/ImagesToPdfView.vue')
    }
  ]
});

export default router;
