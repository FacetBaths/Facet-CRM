<template>
  <q-page class="page-container" v-if="user">
    <!-- Header with Back Button -->
    <div class="row items-center q-mb-md">
      <q-btn
        flat
        icon="arrow_back"
        label="Back"
        @click="$router.back()"
      />
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Left Column: User Profile Card -->
      <div class="col-12 col-md-4">
        <div class="glass-card q-pa-lg text-center">
          <!-- Large Avatar -->
          <user-avatar
            :user="user"
            size="xl"
            :clickable="false"
            :show-tooltip="false"
            class="q-mb-md"
          />

          <div class="text-h5 text-weight-bold q-mb-xs">
            {{ user.firstName }} {{ user.lastName }}
          </div>
          
          <div class="text-caption text-grey-7 q-mb-sm">
            {{ user.employeeId || 'No Employee ID' }}
          </div>

          <div class="q-mb-md">
            <q-badge
              v-for="role in user.roles"
              :key="role"
              :color="roleColor(role)"
              class="q-mr-xs"
            >
              {{ formatRole(role) }}
            </q-badge>
          </div>

          <q-separator class="q-mb-md" />

          <!-- Contact Info -->
          <div class="text-left">
            <div
              v-if="user.email"
              class="row items-center q-mb-sm cursor-pointer"
              @click="copyToClipboard(user.email, 'Email')"
            >
              <q-icon name="email" size="20px" color="primary" class="q-mr-sm" />
              <div class="text-body2 ellipsis">{{ user.email }}</div>
            </div>

            <div
              v-if="user.phone"
              class="row items-center q-mb-sm cursor-pointer"
              @click="copyToClipboard(user.phone, 'Phone')"
            >
              <q-icon name="phone" size="20px" color="positive" class="q-mr-sm" />
              <div class="text-body2">
                {{ formatPhone(user.phone) }}
                <span v-if="user.phoneExtension" class="text-grey-7">
                  ext. {{ user.phoneExtension }}
                </span>
              </div>
            </div>

            <div v-if="user.department" class="row items-center q-mb-sm">
              <q-icon name="business" size="20px" color="accent" class="q-mr-sm" />
              <div class="text-body2">{{ user.department }}</div>
            </div>

            <div v-if="marketName" class="row items-center q-mb-sm">
              <q-icon name="place" size="20px" color="warning" class="q-mr-sm" />
              <div class="text-body2">{{ marketName }}</div>
            </div>

            <div
              v-if="user.status"
              class="row items-center q-mb-sm"
            >
              <q-icon name="circle" size="20px" :color="statusColor(user.status)" class="q-mr-sm" />
              <div class="text-body2 text-capitalize">{{ formatStatus(user.status) }}</div>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- Ping Button -->
          <q-btn
            color="primary"
            icon="chat"
            label="Ping"
            class="full-width"
            @click="showPingDialog = true"
            :disable="!canPing"
          >
            <q-tooltip v-if="!canPing">Cannot ping yourself</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Right Column: Additional Info -->
      <div class="col-12 col-md-8">
        <div class="glass-card q-pa-lg">
          <div class="text-h6 q-mb-md">About</div>

          <div v-if="user.bio" class="q-mb-lg">
            <div class="text-body1">{{ user.bio }}</div>
          </div>
          <div v-else class="text-grey-7 text-italic q-mb-lg">
            No bio provided
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">Employment Type</div>
              <div class="text-body2">{{ formatEmploymentType(user.employmentType) }}</div>
            </div>

            <div v-if="user.hireDate" class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">Hire Date</div>
              <div class="text-body2">{{ formatDate(user.hireDate) }}</div>
            </div>

            <div v-if="user.commissionTier" class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">Commission Tier</div>
              <div class="text-body2">Tier {{ user.commissionTier }}</div>
            </div>
          </div>

          <!-- Social Links -->
          <template v-if="hasSocialLinks">
            <q-separator class="q-my-lg" />
            
            <div class="text-h6 q-mb-md">Social</div>
            
            <div class="row q-gutter-sm">
              <q-btn
                v-if="user.socials?.linkedin"
                flat
                round
                color="primary"
                icon="linkedin"
                type="a"
                :href="user.socials.linkedin"
                target="_blank"
              />
              
              <q-btn
                v-if="user.socials?.twitter"
                flat
                round
                color="secondary"
                icon="twitter"
                type="a"
                :href="user.socials.twitter"
                target="_blank"
              />
              
              <q-btn
                v-if="user.socials?.facebook"
                flat
                round
                color="primary"
                icon="facebook"
                type="a"
                :href="user.socials.facebook"
                target="_blank"
              />
              
              <q-btn
                v-if="user.socials?.instagram"
                flat
                round
                color="accent"
                icon="instagram"
                type="a"
                :href="user.socials.instagram"
                target="_blank"
              />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Ping Dialog -->
    <q-dialog v-model="showPingDialog" persistent>
      <q-card style="min-width: 400px" class="glass-card">
        <q-card-section>
          <div class="row items-center">
            <user-avatar
              :user="user"
              size="md"
              :clickable="false"
              :show-tooltip="false"
              class="q-mr-md"
            />
            <div>
              <div class="text-h6">Send Message</div>
              <div class="text-caption text-grey-7">To: {{ user.firstName }} {{ user.lastName }}</div>
            </div>
          </div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="pingMessage"
            type="textarea"
            label="Message"
            outlined
            autogrow
            rows="3"
            placeholder="Type your message..."
            maxlength="500"
          />
          
          <div class="text-caption text-grey-7 text-right q-mt-sm">
            {{ pingMessage.length }}/500
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Send"
            icon="send"
            @click="sendPing"
            :loading="sendingPing"
            :disable="!pingMessage.trim()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>

  <!-- Loading State -->
  <q-page v-else-if="loading" class="flex flex-center page-container">
    <q-spinner size="50px" color="primary" />
  </q-page>

  <!-- Error State -->
  <q-page v-else class="flex flex-center page-container">
    <div class="text-center">
      <q-icon name="error" size="50px" color="negative" />
      <div class="text-h6 q-mt-md">User not found</div>
      <q-btn color="primary" label="Go Back" @click="$router.back()" class="q-mt-md" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from '@/boot/axios';
import { useAuthStore } from '@/stores/auth';
import UserAvatar from '@/components/UserAvatar.vue';

const $q = useQuasar();
const route = useRoute();
const authStore = useAuthStore();

const user = ref<any>(null);
const loading = ref(true);
const marketName = ref('');

// Ping dialog
const showPingDialog = ref(false);
const pingMessage = ref('');
const sendingPing = ref(false);

const canPing = computed(() => {
  return user.value?._id !== authStore.user?._id;
});

const hasSocialLinks = computed(() => {
  if (!user.value?.socials) return false;
  return Object.values(user.value.socials).some((v) => !!v);
});

const formatRole = (role: string) => {
  const roles: Record<string, string> = {
    admin: 'Admin',
    bdc: 'BDC',
    sales: 'Sales',
    warehouse: 'Warehouse',
    production: 'Production',
    contractor: 'Contractor',
    manager: 'Manager',
    installer: 'Installer',
  };
  return roles[role] || role;
};

const roleColor = (role: string) => {
  const colors: Record<string, string> = {
    admin: 'negative',
    bdc: 'accent',
    sales: 'primary',
    warehouse: 'orange',
    production: 'warning',
    contractor: 'info',
    manager: 'purple',
    installer: 'teal',
  };
  return colors[role] || 'grey';
};

const formatStatus = (status: string) => {
  const statuses: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    terminated: 'Terminated',
  };
  return statuses[status] || status;
};

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'positive',
    inactive: 'grey',
    suspended: 'warning',
    terminated: 'negative',
  };
  return colors[status] || 'grey';
};

const formatEmploymentType = (type?: string) => {
  const types: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contractor: 'Contractor',
    intern: 'Intern',
  };
  return types[type || ''] || type || 'Unknown';
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatPhone = (phone?: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  $q.notify({
    type: 'positive',
    message: `${label} copied to clipboard`,
    timeout: 2000,
  });
};

const sendPing = async () => {
  if (!pingMessage.value.trim()) return;

  sendingPing.value = true;
  try {
    await api.post('/notifications/ping', {
      userId: user.value._id,
      message: pingMessage.value,
      fromUserId: authStore.user?._id,
    });

    $q.notify({
      type: 'positive',
      message: `Message sent to ${user.value.firstName}`,
    });

    pingMessage.value = '';
    showPingDialog.value = false;
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.error || 'Failed to send message',
    });
  } finally {
    sendingPing.value = false;
  }
};

const fetchUser = async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/users/${route.params.id}`);
    user.value = data;
    marketName.value = data.marketId?.name || data.marketId?.code || '';
  } catch (error) {
    console.error('Failed to fetch user:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUser();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  opacity: 0.8;
}
</style>
