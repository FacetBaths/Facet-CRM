import { defineStore } from 'pinia';
import { api } from '@/boot/axios';

export const useEmailStore = defineStore('email', {
  state: () => ({
    templates: [] as Array<{ id: string; name: string; content: string }>,
    history: [] as Array<any>,
  }),

  actions: {
    async fetchTemplates() {
      try {
        const { data } = await api.get('/api/email/templates');
        this.templates = data;
      } catch (error) {
        console.error('Failed to fetch email templates:', error);
      }
    },

    async fetchHistory(entityId: string, entityType: 'project' | 'customer') {
      try {
        const { data } = await api.get(`/api/email/history/${entityType}/${entityId}`);
        this.history = data;
      } catch (error) {
        console.error('Failed to fetch email history:', error);
      }
    },
  },
});