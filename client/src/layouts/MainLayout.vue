<template>
  <q-layout view="hHh LpR lFf">
    <q-header class="glass-header" elevated>
      <div class="responsive-navbar">
        <!-- Brand -->
        <div class="navbar-brand">
          <q-btn flat to="/" class="logo-btn">
            <span class="text-h5 text-weight-bold text-primary">💎 Facet CRM</span>
          </q-btn>
        </div>

        <!-- Nav Links -->
        <div class="navbar-nav">
          <router-link
            v-for="tab in navTabs"
            :key="tab.path"
            :to="tab.path"
            class="nav-link"
            :class="{ 'nav-link--active': $route.path === tab.path }"
          >
            <q-icon :name="tab.icon" class="nav-icon" />
            <span class="nav-label">{{ tab.label }}</span>
          </router-link>
        </div>

        <!-- User Menu -->
        <div class="navbar-user">
          <q-chip color="secondary" text-color="dark" size="sm">{{ userRoleLabel }}</q-chip>
          <q-btn flat round class="user-menu-btn q-ml-sm">
            <q-avatar color="primary" text-color="white" size="36px">
              {{ authStore.initials }}
            </q-avatar>
            <q-menu class="glass-menu" anchor="bottom right" self="top right">
              <q-list style="min-width: 180px">
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section avatar><q-icon name="logout" color="negative" /></q-item-section>
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>
    </q-header>

    <q-page-container class="gradient-bg">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const navTabs = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/projects', label: 'Projects', icon: 'assignment' },
  { path: '/customers', label: 'Customers', icon: 'people' },
  { path: '/subscriptions', label: 'Subscriptions', icon: 'autorenew' },
  { path: '/products', label: 'Products', icon: 'inventory_2' },
  { path: '/commissions', label: 'Commissions', icon: 'paid' },
];

const userRoleLabel = computed(() => {
  const roles: Record<string, string> = {
    admin: 'Admin',
    bdc: 'BDC',
    sales: 'Sales',
    design_consultant: 'Designer',
    production: 'Production',
    contractor: 'Contractor',
  };
  return roles[authStore.user?.role] || 'User';
});

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.responsive-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  min-height: 64px;
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.logo-btn {
  padding: 4px 8px;
  border-radius: 8px;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  color: rgba(0, 0, 0, 0.8);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.nav-link--active {
  color: white !important;
  background: rgba(0, 0, 0, 0.5) !important;
}

.nav-icon {
  font-size: 18px;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-menu-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.user-menu-btn:hover {
  background: rgba(255, 255, 255, 0.35) !important;
}

.glass-menu {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .nav-label {
    display: none;
  }
  
  .nav-link {
    padding: 8px;
  }
  
  .responsive-navbar {
    padding: 8px 12px;
  }
}
</style>
