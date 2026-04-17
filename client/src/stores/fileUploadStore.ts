import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

interface Upload {
  _id: string;
  filename: string;
  url: string;
  relatedId: string;
  relatedType: 'project' | 'customer';
  uploadedBy: string;
  uploadedAt: string;
}

export const useFileUploadStore = defineStore('fileUploads', () => {
  const uploads = ref<Upload[]>([]);
  const isLoading = ref(false);

  const fetchUploads = async (relatedId?: string, relatedType?: 'project' | 'customer') => {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (relatedId) params.append('relatedId', relatedId);
      if (relatedType) params.append('relatedType', relatedType);
      
      const { data } = await api.get(`/uploads?${params.toString()}`);
      uploads.value = data;
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const uploadFile = async (file: File, relatedId: string, relatedType: 'project' | 'customer') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('relatedId', relatedId);
      formData.append('relatedType', relatedType);
      
      const { data } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      uploads.value.push(data);
      return data;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  };

  const deleteUpload = async (id: string) => {
    try {
      await api.delete(`/uploads/${id}`);
      uploads.value = uploads.value.filter(u => u._id !== id);
    } catch (error) {
      console.error('Failed to delete upload:', error);
      throw error;
    }
  };

  return {
    uploads,
    isLoading,
    fetchUploads,
    uploadFile,
    deleteUpload,
  };
});
