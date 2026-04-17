import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/boot/axios';

type ISODate = string;

export interface CalendarEvent {
  _id: string;
  title: string;
  start: ISODate;
  end: ISODate;
  type: 'sales' | 'production';
  projectId?: string;
  customerId?: string;
  assignedTo?: string;
  description?: string;
  allDay?: boolean;
}

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref<CalendarEvent[]>([]);
  const isLoading = ref(false);
  const currentView = ref<'month' | 'week' | 'day'>('month');
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0]);

  const fetchEvents = async (start: string, end: string) => {
    isLoading.value = true;
    try {
      const params = new URLSearchParams({ start, end });
      const { data } = await api.get(`/calendar-events?${params.toString()}`);
      events.value = data;
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const createEvent = async (eventData: Partial<CalendarEvent>) => {
    try {
      const { data } = await api.post('/calendar-events', eventData);
      events.value.push(data);
      return data;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<CalendarEvent>) => {
    try {
      const { data } = await api.put(`/calendar-events/${id}`, eventData);
      const index = events.value.findIndex(e => e._id === id);
      if (index > -1) {
        events.value[index] = data;
      }
      return data;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await api.delete(`/calendar-events/${id}`);
      events.value = events.value.filter(e => e._id !== id);
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  };

  return {
    events,
    isLoading,
    currentView,
    selectedDate,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
});
