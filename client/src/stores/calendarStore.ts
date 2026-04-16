import { defineStore } from 'pinia';
import { api } from '@/boot/axios';


interface CalendarEvent {
  _id?: string;
  title: string;
  description: string;
  type: 'sales_appointment' | 'install_slot' | 'delivery' | 'other';
  projectId?: string;
  customerId?: string;
  assignedUserIds: string[];
  startTime: Date;
  endTime: Date;
  location?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  source: 'crm_created' | 'imported';
  outcome?: 'sales' | 'no_sale' | 'reschedule' | 'credit_decline'; // For sales appointments
}

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    salesEvents: [] as CalendarEvent[],
    productionEvents: [] as CalendarEvent[],
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchEvents(type: 'sales' | 'production') {
      this.isLoading = true;
      this.error = null;
      try {
        const params = { type: type === 'sales' ? 'sales_appointment' : 'install_slot' };
        const { data } = await api.get('/calendar-events', { params });
        if (type === 'sales') {
          this.salesEvents = data;
        } else {
          this.productionEvents = data;
        }
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Failed to fetch events';
      } finally {
        this.isLoading = false;
      }
    },

    async createEvent(event: CalendarEvent) {
      try {
        const { data } = await api.post('/calendar-events', event);
        if (event.type === 'sales_appointment') {
          this.salesEvents.push(data);
        } else if (event.type === 'install_slot') {
          this.productionEvents.push(data);
        }
        return data;
      } catch (err: any) {
        throw new Error(err.response?.data?.error || 'Failed to create event');
      }
    },

    async updateEvent(id: string, updates: Partial<CalendarEvent>) {
      try {
        const { data } = await api.put(`/calendar-events/${id}`, updates);
        // Update local state
        const updateArray = (arr: CalendarEvent[]) => {
          const index = arr.findIndex(e => e._id === id);
          if (index !== -1) {
            arr[index] = { ...arr[index], ...data };
          }
        };
        updateArray(this.salesEvents);
        updateArray(this.productionEvents);
        return data;
      } catch (err: any) {
        throw new Error(err.response?.data?.error || 'Failed to update event');
      }
    },

    async completeSalesAppointment(id: string, outcome: CalendarEvent['outcome']) {
      try {
        const { data } = await api.post(`/calendar-events/${id}/complete`, { outcome });
        // Update local event
        const index = this.salesEvents.findIndex(e => e._id === id);
        if (index !== -1) {
          this.salesEvents[index] = { ...this.salesEvents[index], ...data };
        }
        return data;
      } catch (err: any) {
        throw new Error(err.response?.data?.error || 'Failed to complete appointment');
      }
    },

    async deleteEvent(id: string) {
      try {
        await api.delete(`/calendar-events/${id}`);
        // Remove from local state
        this.salesEvents = this.salesEvents.filter(e => e._id !== id);
        this.productionEvents = this.productionEvents.filter(e => e._id !== id);
      } catch (err: any) {
        throw new Error(err.response?.data?.error || 'Failed to delete event');
      }
    },

    // Check for conflicts (frontend check before create/update)
    checkConflicts(newEvent: CalendarEvent, events: CalendarEvent[]): boolean {
      return events.some(event => 
        event._id !== newEvent._id &&
        event.status !== 'cancelled' &&
        newEvent.startTime < event.endTime &&
        newEvent.endTime > event.startTime &&
        event.assignedUserIds.some(id => newEvent.assignedUserIds.includes(id))
      );
    },
  },
});
