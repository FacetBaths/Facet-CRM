<template>
  <div class="calendar-view">
    <q-tabs v-model="localView" dense align="left" class="q-mb-md">
      <q-tab name="month" label="Month" />
      <q-tab name="week" label="Week" />
      <q-tab name="day" label="Day" />
    </q-tabs>

    <div v-if="localView === 'month'">
      <!-- Month View -->
      <div class="month-grid">
        <div v-for="day in monthDays" :key="day.date" class="day-cell" :class="{ 'current-month': day.currentMonth }">
          <div class="day-header">{{ day.day }}</div>
          <div class="events">
            <q-chip v-for="event in getEventsForDay(day.date)" :key="event._id" draggable @dragstart="dragStart(event, $event)" class="event-chip" :color="eventColor(event)">
              {{ event.title }}
            </q-chip>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="localView === 'week'">
      <!-- Week View -->
      <q-table :rows="weekRows" :columns="weekColumns" row-key="time" dense flat>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="time">{{ props.row.time }}</q-td>
            <q-td v-for="day in weekDays" :key="day">
              <div class="week-cell" @drop="drop(day, $event)" @dragover.prevent>
                <q-chip v-for="event in getEventsForTime(day, props.row.time)" :key="event._id" draggable @dragstart="dragStart(event, $event)" class="event-chip" :color="eventColor(event)">
                  {{ event.title }}
                </q-chip>
              </div>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>

    <div v-else-if="localView === 'day'">
      <!-- Day View -->
      <q-timeline :layout="layout" color="secondary">
        <q-timeline-entry v-for="event in dayEvents" :key="event._id" :title="event.title" :subtitle="formatTime(event.startTime) + ' - ' + formatTime(event.endTime)" :color="eventColor(event)" icon="event">
          {{ event.description }}
        </q-timeline-entry>
      </q-timeline>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { date } from 'quasar';
import type { CalendarEvent } from '@/stores/calendarStore';

const props = defineProps<{
  events: CalendarEvent[];
  view: 'month' | 'week' | 'day';
}>();

const emit = defineEmits(['update:view', 'updateEvent']);

const localView = ref(props.view);
const currentDate = ref(new Date());
const draggedEvent = ref<CalendarEvent | null>(null);

watch(() => props.view, (newView) => {
  localView.value = newView;
});

watch(localView, (newView) => {
  emit('update:view', newView);
});

// Month View
const monthDays = computed(() => {
  const days = [];
  const start = date.startOfDate(currentDate.value, 'month');
  const end = date.endOfDate(currentDate.value, 'month');
  const firstDay = date.getDayOfWeek(start);
  const daysInMonth = date.daysInMonth(end);

  // Padding before month start
  for (let i = 1; i < firstDay; i++) {
    const d = date.subtractFromDate(start, { days: i });
    days.push({ date: d, day: date.formatDate(d, 'D'), currentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = date.adjustDate(start, { date: i });
    days.push({ date: d, day: date.formatDate(d, 'D'), currentMonth: true });
  }

  // Padding after month end
  const remaining = 42 - days.length; // 6 weeks
  for (let i = 1; i <= remaining; i++) {
    const d = date.addToDate(end, { days: i });
    days.push({ date: d, day: date.formatDate(d, 'D'), currentMonth: false });
  }

  return days;
});

// Week View
const weekColumns = [
  { name: 'time', label: 'Time', field: 'time', align: 'left' },
  { name: 'mon', label: 'Mon', field: 'mon' },
  { name: 'tue', label: 'Tue', field: 'tue' },
  { name: 'wed', label: 'Wed', field: 'wed' },
  { name: 'thu', label: 'Thu', field: 'thu' },
  { name: 'fri', label: 'Fri', field: 'fri' },
  { name: 'sat', label: 'Sat', field: 'sat' },
  { name: 'sun', label: 'Sun', field: 'sun' },
];

const weekRows = Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00` }));

const weekDays = computed(() => {
  const start = date.startOfDate(currentDate.value, 'week');
  return Array.from({ length: 7 }, (_, i) => date.addToDate(start, { days: i }));
});

// Day View
const dayEvents = computed(() => {
  const today = date.startOfDate(currentDate.value, 'day');
  const tomorrow = date.addToDate(today, { days: 1 });
  return props.events.filter(e => e.startTime >= today && e.startTime < tomorrow)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
});

const layout = computed(() => 'stacked');

const getEventsForDay = (day: Date) => {
  const start = date.startOfDate(day, 'day');
  const end = date.addToDate(start, { days: 1 });
  return props.events.filter(e => e.startTime >= start && e.startTime < end);
};

const getEventsForTime = (day: Date, time: string) => {
  const [hour] = time.split(':').map(Number);
  const start = date.adjustDate(day, { hours: hour, minutes: 0, seconds: 0 });
  const end = date.addToDate(start, { hours: 1 });
  return props.events.filter(e => e.startTime < end && e.endTime > start);
};

const eventColor = (event: CalendarEvent) => {
  return event.type === 'sales_appointment' ? 'primary' : 'secondary';
};

const formatTime = (d: Date) => date.formatDate(d, 'HH:mm');

const dragStart = (event: CalendarEvent, ev: DragEvent) => {
  draggedEvent.value = event;
  ev.dataTransfer?.setData('text/plain', event._id || '');
};

const drop = (targetDate: Date, ev: DragEvent) => {
  ev.preventDefault();
  if (draggedEvent.value) {
    const newStart = date.adjustDate(targetDate, {
      hours: draggedEvent.value.startTime.getHours(),
      minutes: draggedEvent.value.startTime.getMinutes(),
    });
    const duration = draggedEvent.value.endTime.getTime() - draggedEvent.value.startTime.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    // Check conflicts
    const conflicts = props.events.some(e => 
      e._id !== draggedEvent.value._id &&
      newStart < e.endTime && newEnd > e.startTime
    );

    if (conflicts) {
      // Notify conflict
      // Use Quasar notify
      console.warn('Conflict detected');
    } else {
      emit('updateEvent', draggedEvent.value._id, { startTime: newStart, endTime: newEnd });
    }
    draggedEvent.value = null;
  }
};
</script>

<style scoped>
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.day-cell {
  min-height: 100px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px;
  border-radius: 4px;
}
.current-month {
  background: rgba(255, 255, 255, 0.2);
}
.day-header {
  text-align: right;
  font-size: 12px;
  color: grey;
}
.event-chip {
  margin: 2px 0;
  cursor: move;
}
.week-cell {
  min-height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
