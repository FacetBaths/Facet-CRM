import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/boot/axios';
import { socket } from '@/boot/socket';

export interface Notification {
  _id: string;
  type: 'ping' | 'task' | 'project' | 'system';
  userId: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  message: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const isLoading = ref(false);

  const sortedNotifications = computed(() => {
    return [...notifications.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  const unreadNotifications = computed(() =>
    notifications.value.filter((n) => !n.read)
  );

  // Initialize socket listeners
  const initSocketListeners = () => {
    socket.on('notification:new', (notification: Notification) => {
      notifications.value.unshift(notification);
      unreadCount.value++;
    });
  };

  const fetchNotifications = async () => {
    isLoading.value = true;
    try {
      const { data } = await api.get('/notifications/me');
      notifications.value = data;
      unreadCount.value = data.filter((n: Notification) => !n.read).length;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      const notification = notifications.value.find((n) => n._id === id);
      if (notification && !notification.read) {
        notification.read = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      notifications.value.forEach((n) => {
        n.read = true;
      });
      unreadCount.value = 0;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      const index = notifications.value.findIndex((n) => n._id === id);
      if (index > -1) {
        if (!notifications.value[index].read) {
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
        notifications.value.splice(index, 1);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const sendPing = async (userId: string, message: string) => {
    await api.post('/notifications/ping', { userId, message });
  };

  return {
    notifications: sortedNotifications,
    unreadCount,
    isLoading,
    unreadNotifications,
    initSocketListeners,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendPing,
  };
});
