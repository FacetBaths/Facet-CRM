import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: 'materials' | 'labor' | 'service' | 'package' | 'retail';
  type: 'physical' | 'service' | 'package';
  defaultVendorId?: string;
  variants: {
    sku: string;
    size?: string;
    color?: string;
    costPrice: number;
    retailPrice: number;
    isActive: boolean;
  }[];
  isActive: boolean;
  createdAt: Date;
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
      console.error('Failed to fetch products:', error);
      throw error;
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
      console.error('Failed to fetch product:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const createProduct = async (productData: Partial<Product>) => {
    try {
      const { data } = await api.post('/products', productData);
      products.value.push(data);
      return data;
    } catch (error) {
      console.error('Failed to create product:', error);
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
      return data;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      products.value = products.value.filter(p => p._id !== id);
      if (currentProduct.value?._id === id) {
        currentProduct.value = null;
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
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
    deleteProduct,
  };
});
