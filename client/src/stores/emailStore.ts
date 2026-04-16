import { defineStore } from 'pinia';
import { api } from '@/boot/axios';
import { useQuasar } from 'quasar';

export interface IEmail {
  _id: string;
  subject: string;
  body: string;
  to: string[];
  from: string;
  cc?: string[];
  bcc?: string[];
  status: 'draft' | 'sent' | 'scheduled' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  templateId?: string;
  projectId?: string;
  customerId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmailTemplate {
  _id: string;
  name: string;
  subject: string;
  html: string;
  placeholders: string[]; // e.g., ['customerName', 'repName', 'companyName']
  createdAt: Date;
  updatedAt: Date;
}

export const useEmailStore = defineStore('email', {
  state: () => ({
    emails: [] as IEmail[],
    templates: [] as IEmailTemplate[],
    inbox: [] as IEmail[], 
    currentEmail: null as IEmail | null,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    sentEmails: (state) => state.emails.filter(e => e.status === 'sent'),
    scheduledEmails: (state) => state.emails.filter(e => e.status === 'scheduled'),
    drafts: (state) => state.emails.filter(e => e.status === 'draft'),
  },

  actions: {
    async fetchEmails() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get<IEmail[]>('/emails');
        this.emails = response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Failed to fetch emails';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchInbox() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get<IEmail[]>('/emails/inbox');
        this.inbox = response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Failed to fetch inbox';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchTemplates() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get<IEmailTemplate[]>('/email-templates');
        this.templates = response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Failed to fetch templates';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async sendEmail(emailData: Partial<IEmail>) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post<IEmail>('/emails/send', emailData);
        this.emails.push(response.data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Failed to send email';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async scheduleEmail(emailData: Partial<IEmail>) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post<IEmail>('/emails/schedule', emailData);
        this.emails.push(response.data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Failed to schedule email';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createTemplate(templateData: Partial<IEmailTemplate>) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post<IEmailTemplate>('/email-templates', templateData);
        this.templates.push(response.data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Failed to create template';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

// Log activity moved to backend for consistency
  },
});
