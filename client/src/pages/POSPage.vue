<template>
  <q-page class="q-pa-md page-container">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Point of Sale - Facet Refinery</div>
      <q-btn
        v-if="canProcess"
        color="primary"
        icon="refresh"
        label="New Sale"
        @click="posStore.resetCart"
      />
    </div>

    <div class="row q-gutter-md">
      <div class="col-12 col-md-8">
        <q-card class="glass-card">
          <q-card-section>
            <div class="text-h6">Select Items</div>
          </q-card-section>
          <pos-item-selector />
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card class="glass-card">
          <q-card-section>
            <div class="text-h6">Cart</div>
          </q-card-section>
          <pos-cart :can-process="canProcess" />
        </q-card>
      </div>
    </div>

    <q-dialog v-model="viewOnlyDialog" persistent>
      <q-card class="glass-card">
        <q-card-section>
          <div class="text-h6">View Only Mode</div>
        </q-card-section>
        <q-card-section>
          Your role allows view-only access to POS. Contact an admin, manager, or sales rep to process transactions.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import { usePosStore } from '@/stores/posStore';
import { useProductStore } from '@/stores/productStore';
import PosItemSelector from '@/components/POSItemSelector.vue';
import PosCart from '@/components/POSCart.vue';

const $q = useQuasar();
const authStore = useAuthStore();
const posStore = usePosStore();
const productStore = useProductStore();

const viewOnlyDialog = ref(false);

const canProcess = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('admin') || roles.includes('manager') || roles.includes('sales');
});

onMounted(async () => {
  try {
    await productStore.fetchProducts();
    if (!canProcess.value) {
      viewOnlyDialog.value = true;
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to load products' });
  }
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #9945ff, #ffffff, #14f195);
  background-size: 400% 400%;
  animation: gradientAnimation 15s ease infinite;
}

@keyframes gradientAnimation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>