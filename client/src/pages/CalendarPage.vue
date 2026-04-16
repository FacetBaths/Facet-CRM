<template>
  <q-page class="page-container">
    <div class="text-h5 text-weight-bold q-mb-md">Calendar</div>
    
    <q-tabs v-model="tab" dense class="q-mb-md">
      <q-tab name="sales" label="Sales Calendar" />
      <q-tab name="production" label="Production Calendar" />
    </q-tabs>
    
    <q-card class="glass-card">
      <q-card-section>
        <calendar-view 
          :events="currentEvents" 
          :view="view" 
          @update:view="view = $event"
          @updateEvent="updateEvent"
        />
      </q-card-section>
    </q-card>
    
    <!-- Outcome Dialog for Sales Appointments -->
    <q-dialog v-model="showOutcomeDialog">
      <q-card class="glass-card" style="width: 400px">
        <q-card-section>
          <div class="text-h6">Appointment Outcome</div>
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="selectedOutcome"
            :options="outcomeOptions"
            label="Select Outcome"
            outlined
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Submit" @click="submitOutcome" :disable="!selectedOutcome" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useCalendarStore } from '@/stores/calendarStore';
import { useAuthStore } from '@/stores/auth';
import CalendarView from '@/components/CalendarView.vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const calendarStore = useCalendarStore();
const authStore = useAuthStore();

const tab = ref('sales');
const view = ref('month');
const showOutcomeDialog = ref(false);
const selectedEventId = ref<string | null>(null);
const selectedOutcome = ref('');

const outcomeOptions = [
  { label: 'Sales', value: 'sales' },
  { label: 'No Sale', value: 'no_sale' },
  { label: 'Reschedule', value: 'reschedule' },
  { label: 'Credit Decline', value: 'credit_decline' },
];

const currentEvents = computed(() => {
  return tab.value === 'sales' ? calendarStore.salesEvents : calendarStore.productionEvents;
});

const canEdit = computed(() => {
  if (authStore.hasRole('admin')) return true;\n  if (tab.value === 'sales' && authStore.hasRole('sales')) return true;\n  if (tab.value === 'production' && authStore.hasRole('installer')) return true;\n  return false;
});

onMounted(async () => {
  await calendarStore.fetchEvents('sales');
  await calendarStore.fetchEvents('production');
});

// Example: When completing an event (assuming triggered from CalendarView, but for now simulate)
const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
  calendarStore.updateEvent(id, updates);
};

const submitOutcome = async () => {
  if (selectedEventId.value && selectedOutcome.value) {
    try {
      await calendarStore.completeSalesAppointment(selectedEventId.value, selectedOutcome.value);
      $q.notify({ type: 'positive', message: 'Outcome recorded and pipeline updated' });
      showOutcomeDialog.value = false;
      selectedOutcome.value = '';
      selectedEventId.value = null;
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Failed to record outcome' });
    }
  }
};

import { socket } from '@/boot/socket';

onMounted(() => {
  socket.on('calendar:event_created', (newEvent) => {
    if (newEvent.type === 'sales_appointment') {
      calendarStore.salesEvents.push(newEvent);
    } else if (newEvent.type === 'install_slot') {
      calendarStore.productionEvents.push(newEvent);
    }
  });

  socket.on('calendar:event_updated', (updatedEvent) => {
    calendarStore.updateEvent(updatedEvent._id, updatedEvent);
  });

  socket.on('calendar:event_deleted', (id) => {
    calendarStore.deleteEvent(id);
  });
});

onUnmounted(() => {
  socket.off('calendar:event_created');
  socket.off('calendar:event_updated');
  socket.off('calendar:event_deleted');
});

// Function to show outcome dialog (call from event complete button in CalendarView if needed)
const completeEvent = (eventId: string) => {
  if (tab.value === 'sales') {
    selectedEventId.value = eventId;
    showOutcomeDialog.value = true;
  }
};

</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>
