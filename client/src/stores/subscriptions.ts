import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

export interface SubscriptionService {
  _id: string;
  type: string;
  season?: string;
  scheduledDate?: string;
  completedDate?: string;
  status: string;
  notes?: string;
}

export interface SubscriptionPayment {
  _id: string;
  amount: number;
  date: string;
  status: string;
  method: string;
  recordedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Subscription {
  _id: string;
  customerId: {
    _id: string;
    firstName: string;
    lastName: string;
    contacts: any[];
  };
  plan: 'edge' | 'apex';
  status: 'active' | 'paused' | 'cancelled';
  billingFrequency: 'monthly' | 'annual';
  monthlyAmount: number;
  annualAmount: number;
  nextBillDate: string;
  services: SubscriptionService[];
  payments: SubscriptionPayment[];
  warrantyExpiryDate?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const useSubscriptionStore = defineStore('subscriptions', () => {
  const subscriptions = ref<Subscription[]>([]);
  const currentSubscription = ref<Subscription | null>(null);
  const upcomingRenewals = ref<Subscription[]>([]);
  const isLoading = ref(false);
  const filters = ref({
    status: '',
    plan: '',
    search: '',
  });

  const fetchSubscriptions = async () => {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters.value.status) params.append('status', filters.value.status);
      if (filters.value.plan) params.append('plan', filters.value.plan);
      if (filters.value.search) params.append('search', filters.value.search);
      
      const { data } = await api.get(`/subscriptions?${params.toString()}`);
      subscriptions.value = data;
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchSubscription = async (id: string) => {
    isLoading.value = true;
    try {
      const { data } = await api.get(`/subscriptions/${id}`);
      currentSubscription.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchUpcomingRenewals = async () => {
    isLoading.value = true;
    try {
      const { data } = await api.get('/subscriptions/dashboard/upcoming');
      upcomingRenewals.value = data;
    } catch (error) {
      console.error('Failed to fetch upcoming renewals:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const createSubscription = async (data: any) => {
    try {
      const response = await api.post('/subscriptions', data);
      subscriptions.value.push(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  };

  const updateSubscription = async (id: string, data: any) => {
    try {
      const response = await api.put(`/subscriptions/${id}`, data);
      const index = subscriptions.value.findIndex(s => s._id === id);
      if (index > -1) {
        subscriptions.value[index] = response.data;
      }
      if (currentSubscription.value?._id === id) {
        currentSubscription.value = response.data;
      }
      return response.data;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  };

  const addPayment = async (id: string, payment: any) => {
    try {
      const response = await api.post(`/subscriptions/${id}/payments`, payment);
      if (currentSubscription.value?._id === id) {
        currentSubscription.value.payments.push(response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Failed to add payment:', error);
      throw error;
    }
  };

  const addService = async (id: string, service: any) => {
    try {
      const response = await api.post(`/subscriptions/${id}/services`, service);
      if (currentSubscription.value?._id === id) {
        currentSubscription.value.services.push(response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Failed to add service:', error);
      throw error;
    }
  };

  return {
    subscriptions,
    currentSubscription,
    upcomingRenewals,
    isLoading,
    filters,
    fetchSubscriptions,
    fetchSubscription,
    fetchUpcomingRenewals,
    createSubscription,
    updateSubscription,
    addPayment,
    addService,
  };
});