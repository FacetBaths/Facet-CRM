import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/boot/axios';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export const useUserStore = defineStore('users', () => {
  const users = ref<User[]>([]);
  const isLoading = ref(false);

  const salesUsers = computed(() => 
    users.value.filter(u => ['sales', 'design_consultant'].includes(u.role) && u.isActive)
  );

  const bdcUsers = computed(() =>
    users.value.filter(u => ['bdc'].includes(u.role) && u.isActive)
  );

  const fetchUsers = async () => {
    isLoading.value = true;
    try {
      const { data } = await api.get('/users');
      users.value = data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const getUserName = (id: string) => {
    const user = users.value.find(u => u._id === id);
    return user ? `${user.firstName} ${user.lastName}` : 'Unassigned';
  };

  return {
    users,
    isLoading,
    salesUsers,
    bdcUsers,
    fetchUsers,
    getUserName,
  };
});
