<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Point of Sale</div>
    
    <!-- Search and Barcode -->
    <q-input
      outlined
      v-model="searchQuery"
      label="Search products or scan barcode"
      class="q-mb-md"
      @keyup.enter="searchProducts"
      autofocus
    >
      <template v-slot:append>
        <q-icon name="search" />
      </template>
    </q-input>
    
    <!-- Search Results -->
    <q-list bordered separator v-if="posStore.searchResults.length > 0" class="q-mb-md glass-card">
      <q-item clickable v-ripple v-for="product in posStore.searchResults" :key="product._id" @click="addToCart(product)">
        <q-item-section>
          <q-item-label>{{ product.name }}</q-item-label>
          <q-item-label caption>${{ product.variants[0]?.retailPrice?.toLocaleString() }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn icon="add" flat round />
        </q-item-section>
      </q-item>
    </q-list>
    
    <!-- Cart -->
    <q-card class="glass-card q-mb-md">
      <q-card-section>
        <div class="text-h6">Cart ({{ posStore.cart.length }} items)</div>
      </q-card-section>
      <q-list separator>
        <q-item v-for="(item, index) in posStore.cart" :key="index">
          <q-item-section>
            <q-item-label>{{ item.product.name }}</q-item-label>
            <q-item-label caption>${{ item.product.variants[0]?.retailPrice?.toLocaleString() }} x {{ item.quantity }} = ${{ (item.product.variants[0]?.retailPrice * item.quantity).toLocaleString() }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn icon="remove" flat round @click="posStore.removeFromCart(index)" />
          </q-item-section>
        </q-item>
      </q-list>
      <q-card-section class="text-right">
        <div class="text-h6">Total: ${{ posStore.total.toLocaleString() }}</div>
      </q-card-section>
    </q-card>
    
    <!-- Proceed Button -->
    <q-btn 
      color="primary" 
      label="Proceed to Payment" 
      class="full-width" 
      @click="proceedToPayment" 
      :disable="posStore.cart.length === 0" 
    />
    
    <!-- Payment Dialog -->
    <q-dialog v-model="showPaymentDialog">
      <q-card class="glass-card" style="width: 400px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">Process Payment</div>
          <div class="text-subtitle2">Total: ${{ posStore.total.toLocaleString() }}</div>
        </q-card-section>
        
        <q-card-section>
          <q-select
            v-model="paymentMethod"
            :options="['cash', 'card', 'check']"
            label="Payment Method"
            outlined
          />
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Confirm Payment" @click="confirmPayment" :disable="!paymentMethod" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { usePosStore } from '@/stores/posStore';

const $q = useQuasar();
const posStore = usePosStore();
const searchQuery = ref('');
const paymentMethod = ref('');
const showPaymentDialog = ref(false);

const searchProducts = () => {
  posStore.searchProducts(searchQuery.value);
};

const addToCart = (product) => {
  posStore.addToCart(product);
  searchQuery.value = '';
  posStore.searchResults = []; // Clear results after adding
};

const proceedToPayment = () => {
  if (posStore.cart.length === 0) return;
  showPaymentDialog.value = true;
};

const confirmPayment = async () => {
  try {
    await posStore.processPayment({ method: paymentMethod.value, amount: posStore.total });
    showPaymentDialog.value = false;
    paymentMethod.value = '';
    $q.notify({ type: 'positive', message: 'Payment successful' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Payment failed' });
  }
};
</script>

<style scoped>
/* Add any custom styles if needed */
</style>