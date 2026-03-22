import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/boot/axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref(localStorage.getItem('token') || '');
  const isLoading = ref(false);
  const error = ref('');

  const isAuthenticated = computed(() => !!token.value);
  const fullName = computed(() => 
    user.value ? `${user.value.firstName} ${user.value.lastName}` : ''
  );
  const initials = computed(() =>
    user.value 
      ? `${user.value.firstName[0]}${user.value.lastName[0]}`.toUpperCase()
      : ''
  );

  const setAuth = (userData: User, authToken: string) => {
    user.value = userData;
    token.value = authToken;
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const clearAuth = () => {
    user.value = null;
    token.value = '';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.user, data.token);
      return data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Login failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    clearAuth();
  };

  const init = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch {
        clearAuth();
      }
    }
  };

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    fullName,
    initials,
    login,
    logout,
    init,
    setAuth,
    clearAuth,
  };
});
