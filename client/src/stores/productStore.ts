import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';
import { Notify } from 'quasar';

interface ProductVariant {
  sku: string;
  size?: string;
  color?: string;
  costPrice: number;
  retailPrice: number;
  isActive: boolean;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  category: 'materials' | 'labor' | 'service' | 'package' | 'retail';
  type: 'physical' | 'service' | 'package';
  defaultVendorId?: string;
  variants: ProductVariant[];
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const useProductStore = defineStore('products', () => {
  const products = ref<Product[]>([]);
  const currentProduct = ref<Product | null>(null);
  const isLoading = ref(false);

  const fetchProducts = async () => {
    isLoading.value = true;
    try {
      const { data } = await api.get('/products');
      products.value = data;
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: 'Failed to fetch products'
      });
    } finally {
      isLoading.value = false;
    }
  };

  const fetchProduct = async (id: string) => {
    isLoading.value = true;
    try {
      const { data } = await api.get(`/products/${id}`);
      currentProduct.value = data;
      return data;
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: 'Failed to fetch product'
      });
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const createProduct = async (productData: Partial<Product>) => {
    try {
      const { data } = await api.post('/products', productData);
      products.value.unshift(data);
      Notify.create({
        type: 'positive',
        message: 'Product created successfully'
      });
      return data;
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: 'Failed to create product'
      });
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const { data } = await api.put(`/products/${id}`, productData);
      const index = products.value.findIndex(p => p._id === id);
      if (index > -1) {
        products.value[index] = data;
      }
      if (currentProduct.value?._id === id) {
        currentProduct.value = data;
      }
      Notify.create({
        type: 'positive',
        message: 'Product updated successfully'
      });
      return data;
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: 'Failed to update product'
      });
      throw error;
    }
  };

  const deactivateProduct = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      const index = products.value.findIndex(p => p._id === id);
      if (index > -1) {
        products.value[index].isActive = false;
      }
      Notify.create({
        type: 'positive',
        message: 'Product deactivated successfully'
      });
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: 'Failed to deactivate product'
      });
      throw error;
    }
  };

  return {
    products,
    currentProduct,
    isLoading,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deactivateProduct,
  };
});