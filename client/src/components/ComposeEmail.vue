<template>
  <q-card class="glass-card q-pa-md">
    <q-card-section>
      <div class="text-h6">Compose Email</div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <q-form @submit="sendEmail" class="q-gutter-md">
        <q-chips
          v-model="to"
          label="To"
          color="primary"
          outlined
          add-on-blur
          multiple
          input-debounce="0"
          @add="addRecipient"
          class="full-width"
        >
          <template v-slot:append>
            <q-icon name="add" />
          </template>
        </q-chips>
        <q-input
          v-model="subject"
          label="Subject"
          outlined
          dense
        />
        <q-editor
          v-model="body"
          min-height="200px"
          :dense="$q.screen.lt.sm"
          :toolbar="[
            ['bold', 'italic', 'underline'],
            ['unordered', 'ordered'],
            ['link']
          ]"
        />
        <div class="row justify-end">
          <q-btn label="Send" type="submit" color="primary" :disable="sending" />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useEmailStore } from '@/stores/emailStore'; // Assuming emailStore exists

const $q = useQuasar();
const emailStore = useEmailStore();

const to = ref<string[]>([]);
const subject = ref('');
const body = ref('');
const sending = ref(false);

const addRecipient = (email: string) => {
  // Optional validation
  if (!email.includes('@')) {
    $q.notify({ type: 'warning', message: 'Invalid email address' });
    return;
  }
};

const sendEmail = async () => {
  if (to.value.length === 0 || !subject.value || !body.value) {
    $q.notify({ type: 'warning', message: 'Please fill all fields' });
    return;
  }

  sending.value = true;
  try {
    await emailStore.sendEmail({
      to: to.value,
      subject: subject.value,
      body: body.value,
    });
    $q.notify({ type: 'positive', message: 'Email sent successfully' });
    // Reset form
    to.value = [];
    subject.value = '';
    body.value = '';
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to send email' });
  } finally {
    sending.value = false;
  }
};
</script>

<style scoped>
.q-form {
  animation: fadeIn 0.5s ease-in-out;
}
</style>