<template>
  <q-page class="page-container">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold">Email</div>
      <q-btn
        color="primary"
        icon="add"
        label="Compose"
        @click="showComposer = true"
      />
    </div>

    <div class="row q-col-gutter-md">
      <!-- Inbox List -->
      <div class="col-12 col-md-6">
        <q-card class="glass-card">
          <q-card-section>
            <div class="text-h6">Inbox</div>
          </q-card-section>
          <q-list separator>
            <q-item
              v-for="email in inbox"
              :key="email._id"
              clickable
              @click="selectEmail(email)"
            >
              <q-item-section>
                <q-item-label>{{ email.subject }}</q-item-label>
                <q-item-label caption>{{ email.from }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="emailStatusColor(email.status)">{{ email.status }}</q-badge>
              </q-item-section>
            </q-item>
          </q-list>
          <div v-if="inbox.length === 0" class="text-center q-pa-md text-grey">
            No emails in inbox
          </div>
        </q-card>
      </div>

      <!-- Sent/Scheduled/Drafts -->
      <div class="col-12 col-md-6">
        <q-tabs v-model="tab" dense class="text-primary">
          <q-tab name="sent" label="Sent" />
          <q-tab name="scheduled" label="Scheduled" />
          <q-tab name="drafts" label="Drafts" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="sent">
            <q-list separator>
              <q-item v-for="email in sentEmails" :key="email._id" clickable @click="selectEmail(email)">
                <q-item-section>
                  <q-item-label>{{ email.subject }}</q-item-label>
                  <q-item-label caption>To: {{ email.to.join(', ') }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <q-tab-panel name="scheduled">
            <q-list separator>
              <q-item v-for="email in scheduledEmails" :key="email._id" clickable @click="selectEmail(email)">
                <q-item-section>
                  <q-item-label>{{ email.subject }}</q-item-label>
                  <q-item-label caption>Scheduled: {{ formatDate(email.scheduledAt) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <q-tab-panel name="drafts">
            <q-list separator>
              <q-item v-for="email in drafts" :key="email._id" clickable @click="editDraft(email)">
                <q-item-section>
                  <q-item-label>{{ email.subject || 'Untitled Draft' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>

    <!-- Email Composer Dialog -->
    <q-dialog v-model="showComposer" full-width>
      <email-composer
        @sent="refreshEmails"
        @scheduled="refreshEmails"
        @drafted="refreshEmails"
      />
    </q-dialog>

    <!-- Email Detail Dialog -->
    <q-dialog v-model="showDetail" full-width>
      <q-card class="glass-card">
        <q-card-section>
          <div class="text-h6">{{ selectedEmail?.subject }}</div>
          <div class="text-caption">From: {{ selectedEmail?.from }}</div>
          <div class="text-caption">To: {{ selectedEmail?.to?.join(', ') }}</div>
        </q-card-section>
        <q-card-section>
          <div v-html="selectedEmail?.body"></div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
          <q-btn label="Reply" color="primary" @click="replyToEmail" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useEmailStore } from '@/stores/emailStore';
import { useAuthStore } from '@/stores/auth';
import EmailComposer from '@/components/EmailComposer.vue';

const emailStore = useEmailStore();
const authStore = useAuthStore();

const tab = ref('sent');
const showComposer = ref(false);
const showDetail = ref(false);
const selectedEmail = ref<IEmail | null>(null);

const inbox = computed(() => emailStore.inbox);
const sentEmails = computed(() => emailStore.sentEmails);
const scheduledEmails = computed(() => emailStore.scheduledEmails);
const drafts = computed(() => emailStore.drafts);

const emailStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    unread: 'primary',
    read: 'grey',
  };
  return colors[status] || 'grey';
};

const formatDate = (date?: Date) => {
  return date ? new Date(date).toLocaleString() : '';
};

onMounted(async () => {
  await Promise.all([
    emailStore.fetchInbox(),
    emailStore.fetchEmails(),
  ]);
  checkRBAC();
});

const checkRBAC = () => {
  const userRoles = authStore.user?.roles || [];
  if (!userRoles.includes('admin') && !userRoles.includes('sales') && !userRoles.includes('manager')) {
    // Redirect or show error if no access
    // For now, assume access; implement proper checks
  }
};

const selectEmail = (email: IEmail) => {
  selectedEmail.value = email;
  showDetail.value = true;
  // Mark as read if applicable
};

const editDraft = (draft: IEmail) => {
  // Open composer with draft data
  showComposer.value = true;
  // Pass initialData to composer
};

const replyToEmail = () => {
  showDetail.value = false;
  showComposer.value = true;
  // Set composer with reply data
};
</script>
