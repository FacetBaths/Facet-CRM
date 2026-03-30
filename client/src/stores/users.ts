import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/boot/axios';
import type { UserRole } from '@/stores/auth';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: UserRole[];
  status: 'active' | 'inactive' | 'suspended' | 'terminated';
  avatar?: string;
  phone?: string;
  employeeId?: string;
  marketId?: string;
  teamIds?: string[];
  fullName?: string;
}

export const useUserStore = defineStore('users', () => {
  const users = ref<User[]>([]);
  const isLoading = ref(false);

  const salesUsers = computed(() => 
    users.value
      .filter(u => u.roles.includes('sales') && u.status === 'active')
      .map(u => ({ ...u, fullName: `${u.firstName} ${u.lastName}` }))
  );

  const bdcUsers = computed(() =>
    users.value
      .filter(u => u.roles.includes('bdc') && u.status === 'active')
      .map(u => ({ ...u, fullName: `${u.firstName} ${u.lastName}` }))
  );

  const allUsers = computed(() =>
    users.value.map(u => ({ ...u, fullName: `${u.firstName} ${u.lastName}` }))
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

  const createUser = async (userData: any) => {
    const { data } = await api.post('/users', userData);
    users.value.push(data);
    return data;
  };

  const updateUser = async (id: string, userData: any) => {
    const { data } = await api.put(`/users/${id}`, userData);
    const index = users.value.findIndex(u => u._id === id);
    if (index !== -1) {
      users.value[index] = data;
    }
    return data;
  };

  const deleteUser = async (id: string) => {
    await api.delete(`/users/${id}`);
    users.value = users.value.filter(u => u._id !== id);
  };

  return {
    users: allUsers,
    isLoading,
    salesUsers,
    bdcUsers,
    fetchUsers,
    getUserName,
    createUser,
    updateUser,
    deleteUser,
  };
});