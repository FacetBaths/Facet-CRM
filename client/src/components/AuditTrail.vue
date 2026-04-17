<template>
  <q-card class="glass-card">
    <div class="q-pa-md border-bottom">
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-bold">Audit Trail</div>
        <q-btn flat round icon="refresh" @click="$emit('refresh')" />
      </div>
    </div>

    <div class="q-pa-md">
      <q-timeline color="primary" layout="dense">
        <q-timeline-entry
          v-for="log in sortedLogs"
          :key="log._id"
          :timestamp="formatRelativeTime(log.timestamp)"
          :title="`Update by ${log.userId?.firstName || 'Unknown'} ${log.userId?.lastName || ''}`"
        >
          <template v-slot:subtitle>
            <span :title="formatFullDate(log.timestamp)">
              {{ formatRelativeTime(log.timestamp) }}
            </span>
          </template>

          <template v-slot:side>
            <user-avatar
              :user="log.userId"
              size="sm"
              :show-tooltip="true"
              :show-timestamp="true"
              :timestamp="log.timestamp"
              clickable
              @click="$emit('user-click', log.userId)"
            />
          </template>

          <q-list dense>
            <q-item v-for="(change, idx) in log.changes" :key="idx">
              <q-item-section>
                <q-item-label>
                  <strong>{{ change.field }}</strong>: {{ change.oldValue }} → {{ change.newValue }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-timeline-entry>
      </q-timeline>

      <div v-if="!auditLogs.length" class="text-center text-grey q-pa-lg">
        No audit history yet
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UserAvatar from './UserAvatar.vue';

interface Change {
  field: string;
  oldValue: any;
  newValue: any;
}

interface AuditLog {
  _id: string;
  timestamp: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  changes: Change[];
}

const props = defineProps<{
  auditLogs: AuditLog[];
}>();

const emit = defineEmits(['refresh', 'user-click']);

const sortedLogs = computed(() => {
  return [...props.auditLogs].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
});

const formatRelativeTime = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFullDate = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.q-timeline-entry {
  transition: all 0.3s ease;
}
.q-timeline-entry:hover {
  transform: translateX(4px);
}
</style>