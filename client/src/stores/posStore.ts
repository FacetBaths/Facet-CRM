import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  quantity: number;
  price: number;
}

export const usePosStore = defineStore('pos', () => {
  const cart = ref<CartItem[]>([]);

  const total = computed(() => 
    cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    const existingIndex = cart.value.findIndex(
      (i) => i.productId === item.productId && i.variantId === item.variantId
    );
    if (existingIndex > -1) {
      cart.value[existingIndex].quantity += 1;
    } else {
      cart.value.push({ ...item, quantity: 1 });
    }
  };

  const removeItem = (index: number) => {
    cart.value.splice(index, 1);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(index);
    } else {
      cart.value[index].quantity = quantity;
    }
  };

  const resetCart = () => {
    cart.value = [];
  };

  return {
    cart,
    total,
    addItem,
    removeItem,
    updateQuantity,
    resetCart,
  };
});