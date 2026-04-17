<template>
  <q-dialog v-model="show" persistent>
    <q-card class="glass-card" style="width: 700px; max-width: 80vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-weight-bold">Compose Email</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="reset" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form @submit="sendEmail">
          <q-input
            v-model="emailData.to"
            label="To"
            outlined
            class="q-mb-md"
            :rules="[val => !!val || 'Recipient is required']"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="emailData.subject"
            label="Subject"
            outlined
            class="q-mb-md"
            :rules="[val => !!val || 'Subject is required']"
          >
            <template v-slot:prepend>
              <q-icon name="subject" />
            </template>
          </q-input>

          <q-select
            v-model="selectedTemplate"
            :options="templates"
            label="Select Template"
            outlined
            class="q-mb-md"
            emit-value
            map-options
            clearable
            @update:model-value="applyTemplate"
          >
            <template v-slot:prepend>
              <q-icon name="format_list_bulleted" />
            </template>
          </q-select>

          <q-editor
            v-model="emailData.body"
            min-height="200px"
            placeholder="Compose your message..."
            class="q-mb-md"
          />

          <div class="row justify-end q-mt-md">
            <q-btn label="Cancel" flat @click="reset" class="q-mr-sm" />
            <q-btn label="Send and Log" color="primary" type="submit" :loading="sending" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from '@/boot/axios';
import { useEmailStore } from '@/stores/email'; // Assuming we'll create this store

const props = defineProps<{
  modelValue: boolean;
  entityId: string; // projectId or customerId
  entityType: 'project' | 'customer';
  recipient?: string; // Pre-fill to field
}>();

const emit = defineEmits(['update:modelValue']);

const $q = useQuasar();
const emailStore = useEmailStore();

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const emailData = ref({
  to: props.recipient || '',
  subject: '',
  body: '',
});

const selectedTemplate = ref(null);
const sending = ref(false);

// Load templates from Pinia store
const templates = computed(() => emailStore.templates.map(t => ({
  label: t.name,
  value: t.id,
  content: t.content,
})));

const applyTemplate = (templateId: string | null) => {
  if (!templateId) return;
  const template = templates.value.find(t => t.value === templateId);
  if (template) {
    emailData.value.body = template.content;
  }
};

const sendEmail = async () => {
  sending.value = true;
  try {
    // Assuming backend endpoint /api/email/send-and-log
    const response = await api.post('/api/email/send-and-log', {
      entityId: props.entityId,
      entityType: props.entityType,
      ...emailData.value,
    });
    
    $q.notify({ type: 'positive', message: 'Email sent and logged successfully' });
    reset();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to send email' });
  } finally {
    sending.value = false;
  }
};

const reset = () => {
  emailData.value = { to: '', subject: '', body: '' };
  selectedTemplate.value = null;
  show.value = false;
};

// Watch for recipient prop change
watch(() => props.recipient, (newVal) => {
  emailData.value.to = newVal || '';
});
</script>

<style scoped>
:deep(.q-editor__content) {
  min-height: 200px;
}
</style>