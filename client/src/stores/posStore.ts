import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/boot/axios';
import { Notify } from 'quasar';
import type { Product } from './productStore'; 

export interface CartItem {
  product: Product;
  quantity: number;
}

export const usePosStore = defineStore('pos', () => {
  const cart = ref<CartItem[]>([]);
  const searchResults = ref<Product[]>([]);
  const isLoading = ref(false);

  const total = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.product.variants[0].retailPrice * item.quantity, 0);
  });

  const searchProducts = async (query: string) => {
    if (!query.trim()) return;
    
    isLoading.value = true;
    try {
      const { data } = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
      searchResults.value = data;
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: 'Failed to search products'
      });
    } finally {
      isLoading.value = false;
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    const existing = cart.value.find(item => item.product._id === product._id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.value.push({ product, quantity });
    }
    Notify.create({
      type: 'positive',
      message: `${product.name} added to cart`
    });
  };

  const removeFromCart = (index: number) => {
    cart.value.splice(index, 1);
  };

  const clearCart = () => {
    cart.value = [];
  };

  const processPayment = async (paymentData: { method: string; amount: number }) => {
    try {
      const payload = {
        items: cart.value.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          price: item.product.variants[0].retailPrice
        })),
        total: total.value,
        payment: paymentData
      };
      
      const { data } = await api.post('/pos/checkout', payload);
      clearCart();
      Notify.create({
        type: 'positive',
        message: 'Payment processed successfully'
      });
      return data;
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: 'Failed to process payment'
      });
      throw error;
    }
  };

  return {
    cart,
    searchResults,
    isLoading,
    total,
    searchProducts,
    addToCart,
    removeFromCart,
    clearCart,
    processPayment
  };
});