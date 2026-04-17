import { defineStore } from 'pinia';
import { api } from '@/boot/axios';
import { useAuthStore } from '@/stores/auth';

export interface PnLData {
  projectId: string;
  projectNumber: string;
  contractAmount: number;
  totalPayments: number;
  totalExpenses: number;
  profit: number;
  status: string;
  // Add other relevant fields
}

export const usePnlStore = defineStore('pnl', {
  state: () => ({
    pnlReports: [] as PnLData[],
    isLoading: false,
    error: null as string | null,
    filters: {
      dateRange: { start: '', end: '' },
      status: '',
    },
  }),

  getters: {
    filteredPnL: (state) => {
      // Implement filtering logic here if needed
      return state.pnlReports;
    },
  },

  actions: {
    async fetchPnL() {
      this.isLoading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        let params: any = { ...this.filters };
        
        const user = authStore.user;
        if (user && !user.roles.includes('admin') && !user.roles.includes('manager')) {
          params.assignedTo = user._id;
        }
        
        const response = await api.get('/pnl', { params });
        this.pnlReports = response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Failed to fetch PnL data';
      } finally {
        this.isLoading = false;
      }
    },
  },
});
