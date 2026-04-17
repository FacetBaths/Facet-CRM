<template>
  <q-item class="audit-item">
    <q-item-section avatar>
      <user-avatar :user="audit.userId" size="sm" />
    </q-item-section>
    <q-item-section>
      <q-item-label class="row items-center q-gutter-sm">
        <q-icon :name="actionIcon" :color="actionColor" size="18px" />
        <span class="text-weight-medium">{{ actionText }}</span>
      </q-item-label>
      <q-item-label caption>{{ formatTimestamp(audit.timestamp) }}</q-item-label>
      <q-item-label v-if="audit.changes.length">
        <q-list dense>
          <q-item v-for="(change, idx) in audit.changes" :key="idx" class="q-pa-none">
            <q-item-section>
              <q-item-label caption>
                <span class="text-weight-medium">{{ change.field }}:</span>
                {{ formatValue(change.oldValue) }} → {{ formatValue(change.newValue) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UserAvatar from './UserAvatar.vue';

const props = defineProps<{
  audit: {
    _id: string;
    action: string;
    userId: { firstName: string; lastName: string };
    timestamp: string;
    changes: Array<{ field: string; oldValue: any; newValue: any }>;
  };
}>();

const actionText = computed(() => {
  return props.audit.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
});

const actionIcon = computed(() => {
  const icons: Record<string, string> = {
    create: 'add',
    update: 'edit',
    delete: 'delete',
    status_change: 'sync',
    payment: 'payment',
    // Add more as needed
  };
  return icons[props.audit.action] || 'info';
});

const actionColor = computed(() => {
  const colors: Record<string, string> = {
    create: 'positive',
    update: 'primary',
    delete: 'negative',
    status_change: 'secondary',
    payment: 'positive',
  };
  return colors[props.audit.action] || 'grey';
});

const formatTimestamp = (ts: string) => {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatValue = (val: any) => {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'object') return JSON.stringify(val);
  return val.toString();
};
</script>

<style scoped>
.audit-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
