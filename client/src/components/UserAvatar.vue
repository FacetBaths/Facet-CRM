<template>
  <q-avatar
    :size="sizePixels"
    :color="avatarColor"
    text-color="white"
    class="cursor-pointer user-avatar"
    @click="goToUserDetail"
  >
    <q-img
      v-if="user?.avatar"
      :src="user.avatar"
      :ratio="1"
      class="full-width full-height"
    />
    <span v-else class="text-weight-bold">{{ initials }}</span>
    
    <q-tooltip
      v-if="showTooltip && user"
      class="bg-dark text-white"
      :delay="300"
    >
      <div class="text-weight-medium">{{ fullName }}</div>
      <div v-if="showEmail" class="text-caption text-grey-5">{{ user.email }}</div>
      <div v-if="showTimestamp && timestamp" class="text-caption text-grey-6 q-mt-xs">
        {{ formatTimestamp(timestamp) }}
      </div>
    </q-tooltip>
  </q-avatar>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  email?: string;
}

interface Props {
  user?: User | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
  showEmail?: boolean;
  showTimestamp?: boolean;
  timestamp?: string | Date;
  clickable?: boolean;
}

const emit = defineEmits(['click']);

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showTooltip: true,
  showEmail: false,
  showTimestamp: false,
  clickable: true,
});

const sizePixels = computed(() => {
  const sizes: Record<string, string> = {
    xs: '24px',
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '64px',
  };
  return sizes[props.size] || '40px';
});

const fullName = computed(() => {
  if (!props.user) return 'Unknown User';
  return `${props.user.firstName || ''} ${props.user.lastName || ''}`.trim() || 'Unknown User';
});

const initials = computed(() => {
  if (!props.user) return '?';
  const first = props.user.firstName?.[0] || '';
  const last = props.user.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase() || '?';
});

const avatarColor = computed(() => {
  // Generate a consistent color based on user name
  if (!props.user?.firstName) return 'primary';
  const colors = ['primary', 'secondary', 'accent', 'positive', 'negative', 'warning', 'info'];
  const hash = props.user.firstName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
});

const goToUserDetail = () => {
  if (props.clickable && props.user?._id) {
    emit('click', props.user);
  }
};

const formatTimestamp = (ts: string | Date) => {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.user-avatar {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>
