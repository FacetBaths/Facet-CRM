&lt;template&gt;
  &lt;q-page class=&quot;q-pa-md&quot;&gt;
    &lt;div class=&quot;text-h5 q-mb-md&quot;&gt;Point of Sale&lt;/div&gt;
    
    &lt;!-- Search and Barcode --&gt;
    &lt;q-input
      outlined
      v-model=&quot;searchQuery&quot;
      label=&quot;Search products or scan barcode&quot;
      class=&quot;q-mb-md&quot;
      @keyup.enter=&quot;searchProducts&quot;
      autofocus
    &gt;
      &lt;template v-slot:append&gt;
        &lt;q-icon name=&quot;search&quot; /&gt;
      &lt;/template&gt;
    &lt;/q-input&gt;
    
    &lt;!-- Search Results --&gt;
    &lt;q-list bordered separator v-if=&quot;posStore.searchResults.length &gt; 0&quot; class=&quot;q-mb-md glass-card&quot;&gt;
      &lt;q-item clickable v-ripple v-for=&quot;product in posStore.searchResults&quot; :key=&quot;product._id&quot; @click=&quot;addToCart(product)&quot;&gt;
        &lt;q-item-section&gt;
          &lt;q-item-label&gt;{{ product.name }}&lt;/q-item-label&gt;
          &lt;q-item-label caption&gt;${{ product.variants[0]?.retailPrice?.toLocaleString() }}&lt;/q-item-label&gt;
        &lt;/q-item-section&gt;
        &lt;q-item-section side&gt;
          &lt;q-btn icon=&quot;add&quot; flat round /&gt;
        &lt;/q-item-section&gt;
      &lt;/q-item&gt;
    &lt;/q-list&gt;
    
    &lt;!-- Cart --&gt;
    &lt;q-card class=&quot;glass-card q-mb-md&quot;&gt;
      &lt;q-card-section&gt;
        &lt;div class=&quot;text-h6&quot;&gt;Cart ({{ posStore.cart.length }} items)&lt;/div&gt;
      &lt;/q-card-section&gt;
      &lt;q-list separator&gt;
        &lt;q-item v-for=&quot;(item, index) in posStore.cart&quot; :key=&quot;index&quot;&gt;
          &lt;q-item-section&gt;
            &lt;q-item-label&gt;{{ item.product.name }}&lt;/q-item-label&gt;
            &lt;q-item-label caption&gt;${{ item.product.variants[0]?.retailPrice?.toLocaleString() }} x {{ item.quantity }} = ${{ (item.product.variants[0]?.retailPrice * item.quantity).toLocaleString() }}&lt;/q-item-label&gt;
          &lt;/q-item-section&gt;
          &lt;q-item-section side&gt;
            &lt;q-btn icon=&quot;remove&quot; flat round @click=&quot;posStore.removeFromCart(index)&quot; /&gt;
          &lt;/q-item-section&gt;
        &lt;/q-item&gt;
      &lt;/q-list&gt;
      &lt;q-card-section class=&quot;text-right&quot;&gt;
        &lt;div class=&quot;text-h6&quot;&gt;Total: ${{ posStore.total.toLocaleString() }}&lt;/div&gt;
      &lt;/q-card-section&gt;
    &lt;/q-card&gt;
    
    &lt;!-- Proceed Button --&gt;
    &lt;q-btn 
      color=&quot;primary&quot; 
      label=&quot;Proceed to Payment&quot; 
      class=&quot;full-width&quot; 
      @click=&quot;proceedToPayment&quot; 
      :disable=&quot;posStore.cart.length === 0&quot; 
    /&gt;
    
    &lt;!-- Payment Dialog --&gt;
    &lt;q-dialog v-model=&quot;showPaymentDialog&quot;&gt;
      &lt;q-card class=&quot;glass-card&quot; style=&quot;width: 400px; max-width: 80vw;&quot;&gt;
        &lt;q-card-section&gt;
          &lt;div class=&quot;text-h6&quot;&gt;Process Payment&lt;/div&gt;
          &lt;div class=&quot;text-subtitle2&quot;&gt;Total: ${{ posStore.total.toLocaleString() }}&lt;/div&gt;
        &lt;/q-card-section&gt;
        
        &lt;q-card-section&gt;
          &lt;q-select
            v-model=&quot;paymentMethod&quot;
            :options=&quot;['cash', 'card', 'check']&quot;
            label=&quot;Payment Method&quot;
            outlined
          /&gt;
        &lt;/q-card-section&gt;
        
        &lt;q-card-actions align=&quot;right&quot;&gt;
          &lt;q-btn flat label=&quot;Cancel&quot; v-close-popup /&gt;
          &lt;q-btn color=&quot;primary&quot; label=&quot;Confirm Payment&quot; @click=&quot;confirmPayment&quot; :disable=&quot;!paymentMethod&quot; /&gt;
        &lt;/q-card-actions&gt;
      &lt;/q-card&gt;
    &lt;/q-dialog&gt;
  &lt;/q-page&gt;
&lt;/template&gt;

&lt;script setup lang=&quot;ts&quot;&gt;
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { usePosStore } from '@/stores/posStore';

const $q = useQuasar();
const posStore = usePosStore();
const searchQuery = ref('');
const paymentMethod = ref('');
const showPaymentDialog = ref(false);

const searchProducts = () =&gt; {
  posStore.searchProducts(searchQuery.value);
};

const addToCart = (product) =&gt; {
  posStore.addToCart(product);
  searchQuery.value = '';
  posStore.searchResults = []; // Clear results after adding
};

const proceedToPayment = () =&gt; {
  if (posStore.cart.length === 0) return;
  showPaymentDialog.value = true;
};

const confirmPayment = async () =&gt; {
  try {
    await posStore.processPayment({ method: paymentMethod.value, amount: posStore.total });
    showPaymentDialog.value = false;
    paymentMethod.value = '';
    $q.notify({ type: 'positive', message: 'Payment successful' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Payment failed' });
  }
};
&lt;/script&gt;

&lt;style scoped&gt;
/* Add any custom styles if needed */
&lt;/style&gt;