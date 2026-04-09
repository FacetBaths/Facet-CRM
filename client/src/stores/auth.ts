import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/boot/axios';
import { connectSocket, disconnectSocket, joinUserRoom } from '@/boot/socket';

export type UserRole = 'admin' | 'bdc' | 'sales' | 'warehouse' | 'production' | 'contractor' | 'manager' | 'installer';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  avatar?: string;
  phone?: string;
  phoneExtension?: string;
  bio?: string;
  employeeId?: string;
  employmentType?: string;
  department?: string;
  marketId?: string | { _id: string; name?: string; code?: string };
  teamIds?: string[];
  commissionTier?: number;
  status?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    timezone?: string;
    language?: string;
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      desktop?: boolean;
    };
  };
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

  // Check if user has a specific role
  const hasRole = (role: UserRole) => {
    return user.value?.roles?.includes(role) || false;
  };

  // Check if user has any of the given roles
  const hasAnyRole = (roles: UserRole[]) => {
    if (!user.value) return false;
    return roles.some(role => user.value!.roles.includes(role));
  };

  const setAuth = (userData: User, authToken: string) => {
    user.value = userData;
    token.value = authToken;
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    // Connect socket after successful auth
    connectSocket(authToken);
    // Join user's personal room for notifications
    joinUserRoom(userData._id);
  };

  const clearAuth = () => {
    user.value = null;
    token.value = '';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Disconnect socket on logout
    disconnectSocket();
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
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        user.value = parsedUser;
        token.value = storedToken;
        // Reconnect socket on page reload if we have a token
        connectSocket(storedToken);
        // Rejoin user room for notifications
        joinUserRoom(parsedUser._id);
      } catch {
        clearAuth();
      }
    }
  };

  // Update profile
  const updateProfile = async (profileData: any) => {
    if (!user.value) throw new Error('Not authenticated');
    
    const { data } = await api.put(`/users/${user.value._id}`, profileData);
    
    // Update local user data
    user.value = { ...user.value, ...data };
    localStorage.setItem('user', JSON.stringify(user.value));
    
    return data;
  };

  // Update preferences
  const updatePreferences = async (prefs: any) => {
    if (!user.value) throw new Error('Not authenticated');
    
    const { data } = await api.put('/users/me/preferences', prefs);
    
    // Update local user data
    user.value = { ...user.value, preferences: data };
    localStorage.setItem('user', JSON.stringify(user.value));
    
    return data;
  };

  // Refresh user data from server
  const refreshUser = async () => {
    if (!user.value) return;
    
    try {
      const { data } = await api.get('/users/me/profile');
      user.value = data;
      localStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to refresh user:', err);
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
    hasRole,
    hasAnyRole,
    login,
    logout,
    init,
    setAuth,
    clearAuth,
    updateProfile,
    updatePreferences,
    refreshUser,
  };
});
