import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

interface Vendor {
  _id: string;
  name: string;
  type: 'supplier' | 'subcontractor' | 'utility' | 'other';
  taxId?: string;
  paymentTerms?: string;
  contacts: Array<{
    type: 'primary' | 'billing';
    name: string;
    phone: string;
    email?: string;
  }>;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const useVendorStore = defineStore('vendors', () => {
  const vendors = ref<Vendor[]>([]);
  const currentVendor = ref<Vendor | null>(null);
  const isLoading = ref(false);

  const fetchVendors = async () => {
    isLoading.value = true;
    try {
      const { data } = await api.get('/vendors');
      vendors.value = data;
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchVendor = async (id: string) => {
    isLoading.value = true;
    try {
      const { data } = await api.get(`/vendors/${id}`);
      currentVendor.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const createVendor = async (vendorData: Partial<Vendor>) => {
    try {
      const { data } = await api.post('/vendors', vendorData);
      vendors.value.unshift(data);
      return data;
    } catch (error) {
      console.error('Failed to create vendor:', error);
      throw error;
    }
  };

  const updateVendor = async (id: string, vendorData: Partial<Vendor>) => {
    try {
      const { data } = await api.put(`/vendors/${id}`, vendorData);
      const index = vendors.value.findIndex(v => v._id === id);
      if (index > -1) {
        vendors.value[index] = data;
      }
      if (currentVendor.value?._id === id) {
        currentVendor.value = data;
      }
      return data;
    } catch (error) {
      console.error('Failed to update vendor:', error);
      throw error;
    }
  };

  return {
    vendors,
    currentVendor,
    isLoading,
    fetchVendors,
    fetchVendor,
    createVendor,
    updateVendor,
  };
});
