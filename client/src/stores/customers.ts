import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

interface Change {
  field: string;
  oldValue: any;
  newValue: any;
}

interface AuditLog {
  _id: string;
  timestamp: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  changes: Change[];
}

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  contacts: any[];
  referralSource?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  auditTrail?: AuditLog[];
}

interface Project {
  _id: string;
  projectNumber: string;
  title: string;
  status: string;
  type: string;
  contractValue: number;
  createdAt: string;
}

export const useCustomerStore = defineStore('customers', () => {
  const customers = ref<Customer[]>([]);
  const currentCustomer = ref<Customer | null>(null);
  const customerProjects = ref<Project[]>([]);
  const isLoading = ref(false);
  const projectsLoading = ref(false);
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

  const fetchCustomerProjects = async (id: string) => {
    projectsLoading.value = true;
    try {
      const { data } = await api.get(`/projects/customer/${id}`);
      customerProjects.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch customer projects:', error);
    } finally {
      projectsLoading.value = false;
    }
  };

const fetchAuditTrail = async (id: string) => {
  try {
    const { data } = await api.get(`/customers/${id}/audit`);
    if (currentCustomer.value?._id === id) {
      currentCustomer.value.auditTrail = data;
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch audit trail:', error);
    throw error;
  }
};

  return {
    customers,
    currentCustomer,
    customerProjects,
    isLoading,
    projectsLoading,
    searchQuery,
    fetchCustomers,
    fetchCustomer,
    createCustomer,
    updateCustomer,
    fetchCustomerProjects,
    fetchAuditTrail,
  };
});
