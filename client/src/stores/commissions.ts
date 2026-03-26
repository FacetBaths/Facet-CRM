import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

interface CommissionUser {
  userId: string;
  name: string;
  role: string;
  isOwner?: boolean;
  commissionSettings?: {
    useFlatRate: boolean;
    flatAmount: number;
    percentageRate: number;
    threshold: number;
  };
  earned: number;
  paid: number;
  unpaid: number;
  projectCount: number;
}

interface CommissionDetail {
  projectId: string;
  projectNumber: string;
  customerName: string;
  contractAmount: number;
  amount: number;
  paid: boolean;
  paidDate?: string;
  calculatedAt: string;
}

export const useCommissionStore = defineStore('commissions', () => {
  const users = ref<CommissionUser[]>([]);
  const totals = ref({ earned: 0, paid: 0, unpaid: 0 });
  const rules = ref({
    sales: { percentage: 10, flatAmount: 400, threshold: 4000 },
    bdc: { percentage: 1 },
    admin: { owner: 3, standard: 2 },
  });
  const isLoading = ref(false);
  const userDetail = ref<{
    user: { id: string; name: string; role: string } | null;
    commissions: CommissionDetail[];
    totals: { earned: number; paid: number; unpaid: number };
  } | null>(null);

  const fetchDashboard = async (startDate?: string, endDate?: string) => {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const { data } = await api.get(`/commissions/dashboard?${params.toString()}`);
      users.value = data.users;
      totals.value = data.totals;
      rules.value = data.rules;
    } catch (error) {
      console.error('Failed to fetch commission dashboard:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchUserDetail = async (userId: string, filters?: { startDate?: string; endDate?: string; status?: string }) => {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      
      const { data } = await api.get(`/commissions/user/${userId}?${params.toString()}`);
      userDetail.value = data;
    } catch (error) {
      console.error('Failed to fetch user commissions:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const updateSettings = async (userId: string, settings: any) => {
    try {
      const { data } = await api.put(`/commissions/settings/${userId}`, { commissionSettings: settings });
      // Update local state
      const user = users.value.find(u => u.userId === userId);
      if (user) {
        user.commissionSettings = data;
      }
      return data;
    } catch (error) {
      console.error('Failed to update commission settings:', error);
      throw error;
    }
  };

  const updateRules = async (rules: any) => {
    try {
      const { data } = await api.put('/commissions/rules', rules);
      return data;
    } catch (error) {
      console.error('Failed to update commission rules:', error);
      throw error;
    }
  };

  const markPaid = async (commissions: { projectId: string; type: 'sales' | 'bdc' }[]) => {
    try {
      await api.post('/commissions/pay', { commissions });
    } catch (error) {
      console.error('Failed to mark commissions as paid:', error);
      throw error;
    }
  };

  return {
    users,
    totals,
    rules,
    isLoading,
    userDetail,
    fetchDashboard,
    fetchUserDetail,
    updateSettings,
    updateRules,
    markPaid,
  };
});
