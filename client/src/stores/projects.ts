import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

interface Project {
  _id: string;
  projectNumber: string;
  title: string;
  status: string;
  type: string;
  contractAmount: number;
  customerId: {
    firstName: string;
    lastName: string;
  };
  assignedSalesId?: {
    firstName: string;
    lastName: string;
  };
  leadDate: string;
  updatedAt: string;
}

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<Project[]>([]);
  const currentProject = ref<any>(null);
  const isLoading = ref(false);
  const filters = ref({
    status: '',
    assignedTo: '',
    search: '',
  });

  const fetchProjects = async () => {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters.value.status) params.append('status', filters.value.status);
      if (filters.value.assignedTo) params.append('assignedTo', filters.value.assignedTo);
      if (filters.value.search) params.append('search', filters.value.search);
      
      const { data } = await api.get(`/projects?${params.toString()}`);
      projects.value = data;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchProject = async (id: string) => {
    isLoading.value = true;
    try {
      const { data } = await api.get(`/projects/${id}`);
      currentProject.value = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const createProject = async (projectData: any) => {
    try {
      const { data } = await api.post('/projects', projectData);
      projects.value.unshift(data);
      return data;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  };

  const updateProject = async (id: string, projectData: any) => {
    try {
      const { data } = await api.put(`/projects/${id}`, projectData);
      const index = projects.value.findIndex(p => p._id === id);
      if (index > -1) {
        projects.value[index] = data;
      }
      if (currentProject.value?._id === id) {
        currentProject.value = data;
      }
      return data;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  };

  const addActivity = async (projectId: string, activity: { type: string; content: string }) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/activities`, activity);
      if (currentProject.value?._id === projectId) {
        currentProject.value.activities.push(data);
      }
      return data;
    } catch (error) {
      console.error('Failed to add activity:', error);
      throw error;
    }
  };

  const addTask = async (projectId: string, task: { title: string; description?: string; assignedTo?: string; dueDate?: string }) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/tasks`, task);
      if (currentProject.value?._id === projectId) {
        currentProject.value.tasks.push(data);
      }
      return data;
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error;
    }
  };

  const updateTaskStatus = async (projectId: string, taskId: string, status: string) => {
    try {
      const { data } = await api.put(`/projects/${projectId}/tasks/${taskId}`, { status });
      if (currentProject.value?._id === projectId) {
        const index = currentProject.value.tasks.findIndex((t: any) => t._id === taskId);
        if (index > -1) {
          currentProject.value.tasks[index] = data;
        }
      }
      return data;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  };

  const addPayment = async (projectId: string, payment: { amount: number; type: string; method: string; notes?: string }) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/payments`, payment);
      if (currentProject.value?._id === projectId) {
        // Ensure payments array exists
        if (!currentProject.value.payments) {
          currentProject.value.payments = [];
        }
        currentProject.value.payments.push(data);
        // Update payment milestone progress
        const totalPaid = currentProject.value.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
        currentProject.value.paymentProgress = (totalPaid / currentProject.value.contractAmount) * 100;
      }
      return data;
    } catch (error) {
      console.error('Failed to add payment:', error);
      throw error;
    }
  };

  const calculateCommission = async (projectId: string) => {
    try {
      const { data } = await api.post(`/projects/${projectId}/calculate-commission`);
      if (currentProject.value?._id === projectId) {
        currentProject.value.commission = data.commission;
      }
      return data;
    } catch (error) {
      console.error('Failed to calculate commission:', error);
      throw error;
    }
  };

  return {
    projects,
    currentProject,
    isLoading,
    filters,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    addActivity,
    addTask,
    updateTaskStatus,
    addPayment,
    calculateCommission,
  };
});
