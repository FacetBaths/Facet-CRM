<template>
  <q-layout view="hHh LpR lFf">
    <q-header class="glass-header shadow-2">
      <q-toolbar class="q-py-sm">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
          class="q-mr-sm"
        />

        <q-toolbar-title class="text-weight-bold text-brand-purple">
          Facet CRM
        </q-toolbar-title>

        <q-space />

        <q-btn flat round dense icon="search" class="q-mr-xs" />
        <q-btn flat round dense icon="notifications" class="q-mr-xs">
          <q-badge color="red" floating>3</q-badge>
        </q-btn>
        <q-btn flat round dense icon="account_circle" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="250"
      :breakpoint="500"
      bordered
      class="glass-card"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item v-for="link in links" :key="link.text" :to="link.to" clickable v-ripple>
            <q-item-section avatar>
              <q-icon :name="link.icon" />
            </q-item-section>
            <q-item-section>
              {{ link.text }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      overlay
      behavior="mobile"
      bordered
      class="glass-card"
    >
      <q-list padding>
        <q-item clickable v-close-popup @click="onProfileClick">
          <q-item-section>Profile</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="onSettingsClick">
          <q-item-section>Settings</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="onLogoutClick">
          <q-item-section>Logout</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container class="gradient-bg">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang=\"ts\">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};

const links = computed(() => [
  { text: 'Dashboard', to: '/', icon: 'dashboard' },
  { text: 'Projects', to: '/projects', icon: 'work' },
  { text: 'Customers', to: '/customers', icon: 'people' },
  { text: 'Calendar', to: '/calendar', icon: 'calendar_today' },
  { text: 'Subscriptions', to: '/subscriptions', icon: 'subscriptions' },
  { text: 'Products', to: '/products', icon: 'inventory' },
  { text: 'Vendors', to: '/vendors', icon: 'store' },
  { text: 'POS', to: '/pos', icon: 'point_of_sale' },
  { text: 'Reports', to: '/reports', icon: 'assessment' },
  // Add more based on roles
]);

const onProfileClick = () => {
  router.push('/profile');
  rightDrawerOpen.value = false;
};

const onSettingsClick = () => {
  router.push('/settings');
  rightDrawerOpen.value = false;
};

const onLogoutClick = () => {
  authStore.logout();
  router.push('/login');
  rightDrawerOpen.value = false;
};
</script>

<style scoped>
.glass-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.text-brand-purple {
  color: #9945FF;
}
</style>
