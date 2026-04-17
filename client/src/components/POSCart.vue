<template>
  <div>
    <q-list bordered separator>
      <q-item v-for="(item, index) in posStore.cart" :key="index" clickable>
        <q-item-section>
          <q-item-label>{{ item.name }}</q-item-label>
          <q-item-label caption>${{ item.price.toFixed(2) }} x {{ item.quantity }} = ${{ (item.price * item.quantity).toFixed(2) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn-group flat>
            <q-btn dense icon="remove" @click="posStore.updateQuantity(index, item.quantity - 1)" :disable="item.quantity <= 1" />
            <q-btn dense>{{ item.quantity }}</q-btn>
            <q-btn dense icon="add" @click="posStore.updateQuantity(index, item.quantity + 1)" />
            <q-btn dense icon="delete" color="negative" @click="posStore.removeItem(index)" />
          </q-btn-group>
        </q-item-section>
      </q-item>
      <q-item v-if="posStore.cart.length === 0">
        <q-item-section>
          <q-item-label class="text-center text-grey">Cart is empty</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <div class="q-mt-md text-right text-h6 text-weight-bold">
      Total: ${{ posStore.total.toFixed(2) }}
    </div>

    <q-form v-if="props.canProcess" class="q-mt-md" @submit="processPayment">
      <q-input
        v-model.number="paymentAmount"
        type="number"
        label="Payment Amount"
        :rules="paymentRules"
        dense
        outlined
      />
      <q-select
        v-model="paymentMethod"
        :options="paymentOptions"
        label="Payment Method"
        dense
        outlined
      />
      <q-btn
        type="submit"
        color="positive"
        label="Process Payment"
        class="full-width q-mt-md"
        :disable="posStore.total === 0"
      />
    </q-form>

    <div v-else class="q-mt-md text-warning text-center">
      View-only mode. You cannot process payments.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { usePosStore } from '@/stores/posStore';
import axios from 'axios';

const props = defineProps<{
  canProcess: boolean;
}>();

const $q = useQuasar();
const posStore = usePosStore();

const paymentAmount = ref(posStore.total);
const paymentMethod = ref('cash');

const paymentOptions = ['cash', 'card', 'check', 'other'];

const paymentRules = [
  (val: number) => val >= posStore.total || 'Amount must cover the total',
  (val: number) => val > 0 || 'Amount must be positive',
];

const processPayment = async () => {
  try {
    // Assume backend endpoint /api/pos/process
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/pos/process`, {
      cart: posStore.cart,
      total: posStore.total,
      payment: {
        amount: paymentAmount.value,
        method: paymentMethod.value,
      },
    });
    $q.notify({ type: 'positive', message: 'Payment processed successfully' });
    posStore.resetCart();
    paymentAmount.value = 0;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Payment processing failed' });
  }
};
</script>