<template>
  <q-page class="page-container">
    <!-- Header with View Switcher -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold">Calendar</div>
      <q-tabs
        v-model="calendarStore.currentView"
        dense
        class="text-primary"
        active-color="primary"
        indicator-color="secondary"
      >
        <q-tab name="month" label="Month" />
        <q-tab name="week" label="Week" />
        <q-tab name="day" label="Day" />
      </q-tabs>
      <q-btn flat icon="add" label="New Event" @click="showCreateEvent = true" color="primary" />
    </div>

    <!-- Date Picker for Navigation -->
    <div class="q-mb-md">
      <q-input
        v-model="calendarStore.selectedDate"
        type="date"
        outlined
        dense
        label="Select Date"
        class="max-width-200"
      />
    </div>

    <!-- Calendar Views -->
    <div class="glass-card q-pa-md">
      <!-- Month View -->
      <div v-if="calendarStore.currentView === 'month'">
        <div class="month-grid">
          <div v-for="day in monthDays" :key="day.date" class="day-cell" @dragover.prevent @drop="drop($event, day.date)">
            <div class="day-header">{{ day.day }}</div>
            <div class="events">
              <q-chip
                v-for="event in getEventsForDay(day.date)"
                :key="event._id"
                :color="eventColor(event.type)"
                text-color="white"
                removable
                @remove="deleteEvent(event._id)"
                draggable="true"
                @dragstart="dragStart($event, event)"
              >
                {{ event.title }}
              </q-chip>
            </div>
          </div>
        </div>
      </div>

      <!-- Week View -->
      <div v-if="calendarStore.currentView === 'week'">
        <div class="week-grid">
          <div v-for="day in weekDays" :key="day.date" class="week-day" @dragover.prevent @drop="drop($event, day.date)">
            <div class="day-header">{{ day.day }}</div>
            <div class="events">
              <q-chip
                v-for="event in getEventsForDay(day.date)"
                :key="event._id"
                :color="eventColor(event.type)"
                text-color="white"
                removable
                @remove="deleteEvent(event._id)"
                draggable="true"
                @dragstart="dragStart($event, event)"
              >
                {{ event.title }} ({{ formatTime(event.start) }} - {{ formatTime(event.end) }})
              </q-chip>
            </div>
          </div>
        </div>
      </div>

      <!-- Day View -->
      <div v-if="calendarStore.currentView === 'day'">
        <q-list bordered separator>
          <q-item v-for="event in dayEvents" :key="event._id">
            <q-item-section>
              <q-item-label>{{ event.title }}</q-item-label>
              <q-item-label caption>{{ formatTime(event.start) }} - {{ formatTime(event.end) }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn flat round icon="delete" color="negative" @click="deleteEvent(event._id)" />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-if="dayEvents.length === 0" class="text-center q-pa-md text-grey">No events for this day</div>
      </div>
    </div>

    <!-- Create Event Dialog -->
    <q-dialog v-model="showCreateEvent" persistent>
      <q-card class="glass-card" style="width: 600px; max-width: 80vw;">
        <q-card-section class="row items-center">
          <div class="text-h6">Create New Event</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="resetForm" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="createEvent" class="q-gutter-md">
            <q-input
              v-model="newEvent.title"
              label="Title *"
              outlined
              required
            />

            <q-select
              v-model="newEvent.type"
              :options="eventTypes"
              label="Type *"
              outlined
              emit-value
              map-options
              required
            />

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="startDate"
                  label="Start Date *"
                  outlined
                  required
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy>
                        <q-date v-model="startDate" mask="YYYY-MM-DD" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-6">
                <q-input
                  v-model="startTime"
                  label="Start Time"
                  outlined
                >
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy>
                        <q-time v-model="startTime" mask="HH:mm" format24h />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="endDate"
                  label="End Date *"
                  outlined
                  required
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy>
                        <q-date v-model="endDate" mask="YYYY-MM-DD" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-6">
                <q-input
                  v-model="endTime"
                  label="End Time"
                  outlined
                >
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy>
                        <q-time v-model="endTime" mask="HH:mm" format24h />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>

            <q-toggle v-model="newEvent.allDay" label="All Day Event" color="primary" />

            <q-select
              v-model="newEvent.projectId"
              :options="projectStore.projects"
              option-value="_id"
              option-label="title"
              label="Linked Project"
              outlined
              emit-value
              map-options
              clearable
            />

            <q-select
              v-model="newEvent.customerId"
              :options="customerStore.customers"
              option-value="_id"
              :option-label="cust => cust ? `${cust.firstName} ${cust.lastName}` : ''"
              label="Linked Customer"
              outlined
              emit-value
              map-options
              clearable
            />

            <q-select
              v-model="newEvent.assignedTo"
              :options="userStore.users"
              option-value="_id"
              :option-label="user => user ? `${user.firstName} ${user.lastName}` : ''"
              label="Assigned To"
              outlined
              emit-value
              map-options
              clearable
            />

            <q-input
              v-model="newEvent.description"
              label="Description"
              type="textarea"
              outlined
              autogrow
            />

            <div class="text-right">
              <q-btn label="Cancel" flat @click="showCreateEvent = false; resetForm()" />
              <q-btn label="Create" type="submit" color="primary" :loading="creating" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useCalendarStore, type CalendarEvent } from '@/stores/calendar';
import { useProjectStore } from '@/stores/projects';
import { useCustomerStore } from '@/stores/customers';
import { useUserStore } from '@/stores/users';
import { date } from 'quasar';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const calendarStore = useCalendarStore();
const projectStore = useProjectStore();
const customerStore = useCustomerStore();
const userStore = useUserStore();
const showCreateEvent = ref(false);
const creating = ref(false);

const newEvent = ref<Partial<CalendarEvent>>({});
const startDate = ref<string>(date.formatDate(new Date(), 'YYYY-MM-DD'));
const startTime = ref<string>('09:00');
const endDate = ref<string>(date.formatDate(new Date(), 'YYYY-MM-DD'));
const endTime = ref<string>('10:00');

const eventTypes = [
  { label: 'Sales Appointment', value: 'sales' },
  { label: 'Production Scheduling', value: 'production' },
];

const resetForm = () => {
  newEvent.value = {};
  startDate.value = date.formatDate(new Date(), 'YYYY-MM-DD');
  startTime.value = '09:00';
  endDate.value = date.formatDate(new Date(), 'YYYY-MM-DD');
  endTime.value = '10:00';
};

const createEvent = async () => {
  creating.value = true;
  try {
    const start = date.formatDate(
      date.buildDate({ date: startDate.value, hours: startTime.value.split(':')[0], minutes: startTime.value.split(':')[1] }),
      'YYYY-MM-DDTHH:mm:ss'
    );
    const end = date.formatDate(
      date.buildDate({ date: endDate.value, hours: endTime.value.split(':')[0], minutes: endTime.value.split(':')[1] }),
      'YYYY-MM-DDTHH:mm:ss'
    );

    const eventData = {
      ...newEvent.value,
      start,
      end,
    };

    await calendarStore.createEvent(eventData);
    showCreateEvent.value = false;
    resetForm();
    fetchEvents(); // Refresh events
  } catch (error) {
    console.error('Failed to create event:', error);
  } finally {
    creating.value = false;
  }
};

// Fetch lists if needed
onMounted(() => {
  if (projectStore.projects.length === 0) projectStore.fetchProjects();
  if (customerStore.customers.length === 0) customerStore.fetchCustomers();
  if (userStore.users.length === 0) userStore.fetchUsers();
});

// Compute month days (simple grid)
const monthDays = computed(() => {
  const days = [];
  const start = date.startOfDate(calendarStore.selectedDate, 'month');
  const end = date.endOfDate(calendarStore.selectedDate, 'month');
  let current = start;
  while (new Date(current) <= new Date(end)) {
    days.push({
      date: date.formatDate(current, 'YYYY-MM-DD'),
      day: date.formatDate(current, 'D'),
    });
    current = date.addToDate(current, { days: 1 });
  }
  return days;
});

// Compute week days
const weekDays = computed(() => {
  const days = [];
  const start = date.startOfDate(calendarStore.selectedDate, 'week');
  for (let i = 0; i < 7; i++) {
    const current = date.addToDate(start, { days: i });
    days.push({
      date: date.formatDate(current, 'YYYY-MM-DD'),
      day: date.formatDate(current, 'ddd D'),
    });
  }
  return days;
});

// Day events
const dayEvents = computed(() => {
  return calendarStore.events.filter(event =>
    date.isSameDate(event.start, calendarStore.selectedDate, 'day')
  );
});

// Get events for a day
const getEventsForDay = (day: string) => {
  return calendarStore.events.filter(event =>
    date.isSameDate(event.start, day, 'day')
  );
};

// Event color
const eventColor = (type: string) => {
  return type === 'sales' ? 'primary' : 'secondary';
};

// Format time
const formatTime = (iso: string) => {
  return date.formatDate(iso, 'HH:mm');
};

// Fetch events on date/view change
watch([() => calendarStore.selectedDate, () => calendarStore.currentView], () => {
  fetchEvents();
});

onMounted(() => {
  fetchEvents();
});

const fetchEvents = () => {
  let start, end;
  if (calendarStore.currentView === 'month') {
    start = date.formatDate(date.startOfDate(calendarStore.selectedDate, 'month'), 'YYYY-MM-DD');
    end = date.formatDate(date.endOfDate(calendarStore.selectedDate, 'month'), 'YYYY-MM-DD');
  } else if (calendarStore.currentView === 'week') {
    start = date.formatDate(date.startOfDate(calendarStore.selectedDate, 'week'), 'YYYY-MM-DD');
    end = date.formatDate(date.addToDate(start, { days: 6 }), 'YYYY-MM-DD');
  } else {
    start = calendarStore.selectedDate;
    end = calendarStore.selectedDate;
  }
  calendarStore.fetchEvents(start, end);
};

// Drag functions (basic, to be expanded)
const dragStart = (ev: DragEvent, event: CalendarEvent) => {
  ev.dataTransfer?.setData('eventId', event._id);
};

// Drag drop functions
const drop = async (ev: DragEvent, newDate: string) => {
  ev.preventDefault();
  const eventId = ev.dataTransfer?.getData('eventId');
  if (!eventId) return;

  const event = calendarStore.events.find(e => e._id === eventId);
  if (!event) return;

  // Simple conflict check: if any other event on that day
  const dayEvents = getEventsForDay(newDate).filter(e => e._id !== eventId);
  if (dayEvents.length > 0) {
    $q.dialog({
      title: 'Conflict Detected',
      message: `There are ${dayEvents.length} event(s) on this day. Proceed with reschedule?`,
      cancel: true,
      persistent: true
    }).onOk(async () => {
      await updateEventDate(event, newDate);
    });
  } else {
    await updateEventDate(event, newDate);
  }
};

const updateEventDate = async (event: CalendarEvent, newDate: string) => {
  const startTime = date.formatDate(event.start, 'HH:mm:ss');
  const endTime = date.formatDate(event.end, 'HH:mm:ss');

  const newStart = `${newDate}T${startTime}`;
  const newEnd = `${newDate}T${endTime}`;

  await calendarStore.updateEvent(event._id, { start: newStart, end: newEnd });
  fetchEvents(); // Refresh
};

// Delete event
const deleteEvent = async (id: string) => {
  await calendarStore.deleteEvent(id);
  fetchEvents();
};
</script>

<style scoped>
.page-container {
  padding: 16px;
  background: linear-gradient(135deg, #9945FF, #14F195);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day-cell {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 8px;
  min-height: 100px;
}

.day-header {
  text-align: right;
  font-size: 12px;
  color: white;
}

.week-grid {
  display: flex;
  gap: 8px;
}

.week-day {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 8px;
  min-height: 200px;
}

.max-width-200 {
  max-width: 200px;
}
</style>
