import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  contacts: {
    type: string;
    name: string;
    phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  }[];
  referralSource: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useCustomerStore = defineStore('customers', () => {
  const customers = ref<Customer[]>([]);
  const currentCustomer = ref<Customer | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchCustomers = async () => {
    isLoading.value = true;
    try {
      const { data } = await api.get('/customers');
      customers.value = data;
    } catch (err) {
      error.value = (err as Error).message || 'Failed to fetch customers';
      console.error('Failed to fetch customers:', err);
      throw err;
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
    } catch (err) {
      error.value = (err as Error).message || 'Failed to fetch customer';
      console.error('Failed to fetch customer:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createCustomer = async (customerData: Partial<Customer>) => {
    try {
      const { data } = await api.post('/customers', customerData);
      customers.value.push(data);
      return data;
    } catch (err) {
      error.value = (err as Error).message || 'Failed to create customer';
      console.error('Failed to create customer:', err);
      throw err;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
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
    } catch (err) {
      error.value = (err as Error).message || 'Failed to update customer';
      console.error('Failed to update customer:', err);
      throw err;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await api.delete(`/customers/${id}`);
      customers.value = customers.value.filter(c => c._id !== id);
      if (currentCustomer.value?._id === id) {
        currentCustomer.value = null;
      }
    } catch (err) {
      error.value = (err as Error).message || 'Failed to delete customer';
      console.error('Failed to delete customer:', err);
      throw err;
    }
  };

  return {
    customers,
    currentCustomer,
    isLoading,
    error,
    fetchCustomers,
    fetchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
});
