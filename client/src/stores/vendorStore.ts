import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

interface Vendor {
  _id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  notes: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const useVendorStore = defineStore('vendors', () => {
  const vendors = ref<Vendor[]>([]);
  const isLoading = ref(false);

  const fetchVendors = async () => {
    isLoading.value = true;
    try {
      const { data } = await api.get('/vendors');
      vendors.value = data;
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const createVendor = async (vendorData: Partial<Vendor>) => {
    try {
      const { data } = await api.post('/vendors', vendorData);
      vendors.value.push(data);
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
      return data;
    } catch (error) {
      console.error('Failed to update vendor:', error);
      throw error;
    }
  };

  const deleteVendor = async (id: string) => {
    try {
      await api.delete(`/vendors/${id}`);
      vendors.value = vendors.value.filter(v => v._id !== id);
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      throw error;
    }
  };

  return {
    vendors,
    isLoading,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
  };
});
