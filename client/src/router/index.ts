import { defineRouter } from '#q-app/wrappers';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('@/pages/DashboardPage.vue'),
        name: 'dashboard',
      },
      {
        path: 'projects/pipeline',
        component: () => import('@/pages/PipelinePage.vue'),
        name: 'pipeline',
      },
      {
        path: 'projects',
        component: () => import('@/pages/ProjectsPage.vue'),
        name: 'projects',
      },
      {
        path: 'projects/:id',
        component: () => import('@/pages/ProjectDetailPage.vue'),
        name: 'project-detail',
      },
      {
        path: 'customers',
        component: () => import('@/pages/CustomersPage.vue'),
        name: 'customers',
      },
      {
        path: 'customers/:id',
        component: () => import('@/pages/CustomerDetailPage.vue'),
        name: 'customer-detail',
      },
      {
        path: 'subscriptions',
        component: () => import('@/pages/SubscriptionsPage.vue'),
        name: 'subscriptions',
      },
      {
        path: 'products',
        component: () => import('@/pages/ProductsPage.vue'),
        name: 'products',
      },
      {
        path: 'commissions',
        component: () => import('@/pages/CommissionsPage.vue'),
        name: 'commissions',
      },
      {
        path: 'vendors',
        component: () => import('@/pages/VendorsPage.vue'),
        name: 'vendors',
      },
      {
        path: 'users',
        component: () => import('@/pages/UserManagementPage.vue'),
        name: 'users',
      },
      {
        path: 'users/:id',
        component: () => import('@/pages/UserDetailPage.vue'),
        name: 'user-detail',
      },
      {
        path: 'profile',
        component: () => import('@/pages/ProfilePage.vue'),
        name: 'profile',
      },
      {
        path: 'company-settings',
        component: () => import('@/pages/CompanySettingsPage.vue'),
        name: 'company-settings',
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default defineRouter(function ({ ssrContext }) {
  const Router = createRouter({
    routes,
    history: createWebHistory(import.meta.env.VITE_ROUTER_BASE || '/'),
  });

  Router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    
    // Initialize auth store from localStorage on first load
    if (!authStore.user) {
      authStore.init();
    }
    
    if (!to.meta.public && !authStore.isAuthenticated) {
      next('/login');
    } else if (to.path === '/login' && authStore.isAuthenticated) {
      next('/');
    } else {
      next();
    }
  });

  return Router;
});
