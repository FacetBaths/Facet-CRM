<template>
  <q-card class="glass-card q-pa-md">
    <q-card-section>
      <div class="text-h6">Compose Email</div>
    </q-card-section>

    <q-card-section class="q-gutter-md">
      <!-- To -->
      <q-input
        v-model="email.to"
        label="To"
        outlined
        dense
        type="email"
        multiple
      >
        <template v-slot:append>
          <q-btn flat icon="add" @click="addRecipient('to')" />
        </template>
      </q-input>

      <!-- CC -->
      <q-input
        v-model="email.cc"
        label="CC"
        outlined
        dense
        type="email"
        multiple
      >
        <template v-slot:append>
          <q-btn flat icon="add" @click="addRecipient('cc')" />
        </template>
      </q-input>

      <!-- BCC -->
      <q-input
        v-model="email.bcc"
        label="BCC"
        outlined
        dense
        type="email"
        multiple
      >
        <template v-slot:append>
          <q-btn flat icon="add" @click="addRecipient('bcc')" />
        </template>
      </q-input>

      <!-- Subject -->
      <q-input
        v-model="email.subject"
        label="Subject"
        outlined
        dense
      />

      <!-- Template Selection -->
      <q-select
        v-model="selectedTemplate"
        :options="templates"
        label="Select Template"
        outlined
        dense
        option-label="name"
        option-value="_id"
        emit-value
        map-options
        @update:model-value="applyTemplate"
      />

      <!-- Placeholders -->
      <div class="row q-gutter-sm">
        <q-btn
          v-for="placeholder in availablePlaceholders"
          :key="placeholder"
          label="{{placeholder}}"
          color="primary"
          flat
          dense
          @click="insertPlaceholder(placeholder)"
        />
      </div>

      <!-- Body Editor -->
      <q-editor
        v-model="email.body"
        min-height="200px"
        :definitions="editorDefinitions"
        :toolbar="editorToolbar"
      />
    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="Save Draft" flat @click="saveDraft" />
      <q-btn label="Schedule" color="secondary" @click="scheduleEmail" />
      <q-btn label="Send" color="primary" @click="sendEmail" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEmailStore } from '@/stores/emailStore';
import { useQuasar } from 'quasar';
import { IEmail } from '@/types/email'; // Assuming IEmail is defined in a types file

const $q = useQuasar();
const emailStore = useEmailStore();

const props = defineProps<{
  projectId?: string;
  customerId?: string;
  initialData?: Partial<IEmail>;
}>();

const emit = defineEmits(['sent', 'scheduled', 'drafted']);

const email = ref<IEmail>({
  _id: '',
  subject: '',
  body: '',
  to: [],
  from: 'user@domain.com', // Default or from auth
  cc: [],
  bcc: [],
  status: 'draft',
  projectId: props.projectId,
  customerId: props.customerId,
  createdBy: '', // From auth
  createdAt: new Date(),
  updatedAt: new Date(),
});

const selectedTemplate = ref<string | null>(null);

const templates = computed(() => emailStore.templates);

const availablePlaceholders = ref<string[]>(['customerName', 'repName', 'companyName', 'projectNumber', 'contractAmount']); // From task: to be provided later, using examples

// Editor config for HTML body
const editorToolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  ['unordered', 'ordered'],
  ['link', 'image'],
  ['fullscreen'],
];

const editorDefinitions = {
  bold: { label: 'Bold', icon: null, tip: 'Bold' },
  // etc.
};

onMounted(async () => {
  await emailStore.fetchTemplates();
  if (props.initialData) {
    email.value = { ...email.value, ...props.initialData };
  }
});

const applyTemplate = (templateId: string) => {
  const template = templates.value.find(t => t._id === templateId);
  if (template) {
    email.value.subject = template.subject;
    email.value.body = template.html;
    availablePlaceholders.value = template.placeholders;
  }
};

const insertPlaceholder = (placeholder: string) => {
  const editor = document.querySelector('.q-editor__content');
  if (editor) {
    const selection = window.getSelection();
    if (selection.rangeCount) {
      const range = selection.getRangeAt(0);
      range.insertNode(document.createTextNode(`{{${placeholder}}}`));
      range.collapse(false);
    }
  }
};

const addRecipient = (field: 'to' | 'cc' | 'bcc') => {
  // Logic to add recipient, perhaps open dialog or autocomplete
  $q.notify({ message: 'Add recipient functionality to be implemented' });
};

const saveDraft = async () => {
  try {
    const draft = { ...email.value, status: 'draft' };
    await emailStore.sendEmail(draft); // Adapt to saveDraft action if needed
    emit('drafted');
    $q.notify({ type: 'positive', message: 'Draft saved' });
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message });

    $q.notify({ type: 'negative', message: 'Failed to save draft' });
  }
};

const sendEmail = async () => {
  try {
    await emailStore.sendEmail(email.value);
    emit('sent');
    $q.notify({ type: 'positive', message: 'Email sent' });
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message });

    $q.notify({ type: 'negative', message: 'Failed to send email' });
  }
};

const scheduleEmail = async () => {
  // Prompt for schedule time
  $q.dialog({
    title: 'Schedule Email',
    message: 'Select date and time',
    prompt: { model: '', type: 'datetime-local' },
    cancel: true,
  }).onOk(async (data) => {
    try {
      await emailStore.scheduleEmail({ ...email.value, scheduledAt: new Date(data) });
      emit('scheduled');
      $q.notify({ type: 'positive', message: 'Email scheduled' });
    } catch (error) {
    $q.notify({ type: 'negative', message: error.message });

      $q.notify({ type: 'negative', message: 'Failed to schedule email' });
    }
  });
};
</script>
