<template>
  <q-card class="glass-card q-pa-md">
    <q-card-section>
      <div class="text-h6">Email Thread</div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <q-timeline color="secondary" :layout="$q.screen.lt.sm ? 'dense' : 'comfortable'">
        <q-timeline-entry
          v-for="(email, index) in thread"
          :key="index"
          :title="email.subject"
          :subtitle="formatDate(email.date) + ' - From: ' + email.from"
          :side="index % 2 === 0 ? 'left' : 'right'"
          icon="mail"
        >
          <div class="q-mb-md">To: {{ email.to.join(', ') }}</div>
          <div v-html="email.body"></div>
        </q-timeline-entry>
      </q-timeline>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

interface Email {
  from: string;
  to: string[];
  subject: string;
  body: string;
  date: Date;
}

defineProps<{
  thread: Email[];
}>();

const $q = useQuasar();

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
:deep(.q-timeline__content) {
  animation: fadeIn 0.5s ease-in-out;
  animation-delay: calc(var(--index) * 0.1s);
}
</style>