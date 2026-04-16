import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

interface Subscription {
  _id: string;
  customerId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  plan: 'edge' | 'apex';
  status: 'active' | 'paused' | 'cancelled';
  billingFrequency: 'monthly' | 'annual';
  monthlyAmount: number;
  annualAmount: number;
  nextBillDate: Date;
  services: {
    type: string;
    season: string;
    scheduledDate: Date;
    completedDate: Date;
    status: 'scheduled' | 'completed' | 'cancelled';
  }[];
  payments: {
    amount: number;
    date: Date;
    status: 'pending' | 'completed' | 'failed';
    method: string;
  }[];
  createdAt: Date;
}

export const useSubscriptionStore = defineStore('subscriptions', () => {
  const subscriptions = ref<Subscription[]>([]);
  const currentSubscription = ref<Subscription | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchSubscriptions = async () => {
    isLoading.value = true;
    try {
      const { data } = await api.get('/subscriptions');
      subscriptions.value = data;
    } catch (err) {
      error.value = (err as Error).message || 'Failed to fetch subscriptions';
      console.error('Failed to fetch subscriptions:', err);
      throw err;
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
    } catch (err) {
      error.value = (err as Error).message || 'Failed to fetch subscription';
      console.error('Failed to fetch subscription:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createSubscription = async (subscriptionData: Partial<Subscription>) => {
    try {
      const { data } = await api.post('/subscriptions', subscriptionData);
      subscriptions.value.push(data);
      return data;
    } catch (err) {
      error.value = (err as Error).message || 'Failed to create subscription';
      console.error('Failed to create subscription:', err);
      throw err;
    }
  };

  const updateSubscription = async (id: string, subscriptionData: Partial<Subscription>) => {
    try {
      const { data } = await api.put(`/subscriptions/${id}`, subscriptionData);
      const index = subscriptions.value.findIndex(s => s._id === id);
      if (index > -1) {
        subscriptions.value[index] = data;
      }
      if (currentSubscription.value?._id === id) {
        currentSubscription.value = data;
      }
      return data;
    } catch (err) {
      error.value = (err as Error).message || 'Failed to update subscription';
      console.error('Failed to update subscription:', err);
      throw err;
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      await api.delete(`/subscriptions/${id}`);
      subscriptions.value = subscriptions.value.filter(s => s._id !== id);
      if (currentSubscription.value?._id === id) {
        currentSubscription.value = null;
      }
    } catch (err) {
      error.value = (err as Error).message || 'Failed to delete subscription';
      console.error('Failed to delete subscription:', err);
      throw err;
    }
  };

  return {
    subscriptions,
    currentSubscription,
    isLoading,
    error,
    fetchSubscriptions,
    fetchSubscription,
    createSubscription,
    updateSubscription,
    deleteSubscription,
  };
});
