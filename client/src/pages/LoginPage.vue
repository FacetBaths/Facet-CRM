<template>
  <div class="fullscreen flex flex-center page-container">
    <div class="glass-card login-card q-pa-xl">
      <div class="text-center q-mb-lg">
        <div class="text-h3 text-weight-bold text-primary q-mb-sm">💎 Facet CRM</div>
        <div class="text-subtitle1 text-dark">A luxurious look. A cut above.</div>
      </div>

      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-input
          v-model="email"
          label="Email"
          type="email"
          outlined
          bg-color="rgba(255,255,255,0.5)"
          :rules="[val => !!val || 'Email is required']"
        >
          <template v-slot:prepend>
            <q-icon name="email" />
          </template>
        </q-input>

        <q-input
          v-model="password"
          label="Password"
          type="password"
          outlined
          bg-color="rgba(255,255,255,0.5)"
          :rules="[val => !!val || 'Password is required']"
        >
          <template v-slot:prepend>
            <q-icon name="lock" />
          </template>
        </q-input>

        <q-btn
          type="submit"
          label="Sign In"
          color="primary"
          class="full-width q-mt-lg"
          size="lg"
          :loading="authStore.isLoading"
          unelevated
        />
      </q-form>

      <div v-if="authStore.error" class="text-negative text-center q-mt-md">
        {{ authStore.error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');

const onSubmit = async () => {
  try {
    await authStore.login(email.value, password.value);
    router.push('/');
  } catch {
    // Error handled by store
  }
};
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 420px;
}
</style>
