import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

interface IAudit {
  _id: string;
  entityType: 'project' | 'customer';
  entityId: string;
  action: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  timestamp: string;
  changes: Array<{ field: string; oldValue: any; newValue: any }>;
}

export const useAuditStore = defineStore('audit', () => {
  const audits = ref<IAudit[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref({
    entityType: '',
    entityId: '',
    dateFrom: '',
    dateTo: '',
    userId: '',
    action: '',
  });

  const fetchAudits = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const params = { ...filters.value };
      const { data } = await api.get('/audits', { params });
      audits.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch audits';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    audits,
    isLoading,
    error,
    filters,
    fetchAudits,
  };
});
