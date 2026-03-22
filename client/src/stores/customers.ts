import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  contacts: any[];
  referralSource?: string;
  createdAt: string;
}

export const useCustomerStore = defineStore('customers', () => {
  const customers = ref<Customer[]>([]);
  const currentCustomer = ref<any>(null);
  const isLoading = ref(false);
  const searchQuery = ref('');

  const fetchCustomers = async () => {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (searchQuery.value) params.append('search', searchQuery.value);
      
      const { data } = await api.get(`/customers?${params.toString()}`);
      customers.value = data;
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchCustomer = async (id: string) => {
    isLoading.value = true;
    try {
      const { data } = await api.get(`/customers/${id}`);
      currentCustomer.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const createCustomer = async (customerData: any) => {
    try {
      const { data } = await api.post('/customers', customerData);
      customers.value.unshift(data);
      return data;
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, customerData: any) => {
    try {
      const { data } = await api.put(`/customers/${id}`, customerData);
      const index = customers.value.findIndex(c => c._id === id);
      if (index > -1) {
        customers.value[index] = data;
      }
      if (currentCustomer.value?._id === id) {
        currentCustomer.value = data;
      }
      return data;
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  };

  return {
    customers,
    currentCustomer,
    isLoading,
    searchQuery,
    fetchCustomers,
    fetchCustomer,
    createCustomer,
    updateCustomer,
  };
});
