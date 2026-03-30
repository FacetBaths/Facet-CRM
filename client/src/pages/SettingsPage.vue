<template>
  <q-page class="page-container">
    <div class="text-h5 text-weight-bold q-mb-md">Settings</div>
    
    <div class="row q-col-gutter-lg">
      <!-- Appearance -->
      <div class="col-12 col-md-6">
        <q-card class="glass-card q-pa-lg q-mb-lg">
          <div class="text-h6 q-mb-md"><q-icon name="palette" class="q-mr-sm" /> Appearance</div>
          
          <q-item class="q-pa-none q-mb-md">
            <q-item-section>
              <q-item-label>Theme</q-item-label>
              <q-item-label caption>Choose your preferred color theme</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn-toggle
                v-model="preferences.theme"
                :options="[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                  { label: 'Auto', value: 'auto' },
                ]"
                color="primary"
                toggle-color="primary"
              />
            </q-item-section>
          </q-item>
          
          <q-separator class="q-my-md"/>
          
          <q-item class="q-pa-none">
            <q-item-section>
              <q-item-label>Date Format</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-select
                v-model="preferences.dateFormat"
                :options="dateFormatOptions"
                outlined
                dense
                style="width: 150px"
              />
            </q-item-section>
          </q-item>
          
          <q-item class="q-pa-none q-mt-md">
            <q-item-section>
              <q-item-label>Time Format</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn-toggle
                v-model="preferences.timeFormat"
                :options="[
                  { label: '12h', value: '12h' },
                  { label: '24h', value: '24h' },
                ]"
                color="primary"
                toggle-color="primary"
              />
            </q-item-section>
          </q-item>
        </q-card>
        
        <!-- Regional -->
        <q-card class="glass-card q-pa-lg">
          <div class="text-h6 q-mb-md"><q-icon name="language" class="q-mr-sm" /> Regional</div>
          
          <q-select
            v-model="preferences.timezone"
            :options="timezoneOptions"
            label="Timezone"
            outlined
            class="q-mb-md"
            emit-value
            map-options
          />
          
          <q-select
            v-model="preferences.language"
            :options="languageOptions"
            label="Language"
            outlined
            emit-value
            map-options
          />
        </q-card>
      </div>
      
      <!-- Notifications -->
      <div class="col-12 col-md-6">
        <q-card class="glass-card q-pa-lg">
          <div class="text-h6 q-mb-md"><q-icon name="notifications" class="q-mr-sm" /> Notifications</div>
          
          <q-list>
            <q-item tag="label" v-ripple class="q-pa-none">
              <q-item-section avatar>
                <q-checkbox v-model="preferences.notifications.email" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Email Notifications</q-item-label>
                <q-item-label caption>Receive updates via email</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="email" color="primary" />
              </q-item-section>
            </q-item>
            
            <q-separator class="q-my-sm" />
            
            <q-item tag="label" v-ripple class="q-pa-none">
              <q-item-section avatar>
                <q-checkbox v-model="preferences.notifications.push" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Push Notifications</q-item-label>
                <q-item-label caption>Browser push notifications</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="notifications_active" color="primary" />
              </q-item-section>
            </q-item>
            
            <q-separator class="q-my-sm" />
            
            <q-item tag="label" v-ripple class="q-pa-none">
              <q-item-section avatar>
                <q-checkbox v-model="preferences.notifications.desktop" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Desktop Notifications</q-item-label>
                <q-item-label caption>Show notifications on desktop</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="desktop_windows" color="primary" />
              </q-item-section>
            </q-item>
            
            <q-separator class="q-my-sm" />
            
            <q-item tag="label" v-ripple class="q-pa-none">
              <q-item-section avatar>
                <q-checkbox v-model="preferences.notifications.sms" />
              </q-item-section>
              <q-item-section>
                <q-item-label>SMS Notifications</q-item-label>
                <q-item-label caption>Receive text message alerts</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="sms" color="primary" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
    
    <!-- Save Button -->
    <div class="row q-mt-lg">
      <div class="col">
        <q-btn color="primary" label="Save Preferences" @click="savePreferences" :loading="saving" size="lg" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const authStore = useAuthStore();

const saving = ref(false);

const preferences = ref({
  theme: 'auto',
  timezone: 'America/Chicago',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  notifications: {
    email: true,
    push: true,
    desktop: true,
    sms: false,
  },
});

const dateFormatOptions = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
];

const timezoneOptions = [
  { label: 'Eastern Time (ET)', value: 'America/New_York' },
  { label: 'Central Time (CT)', value: 'America/Chicago' },
  { label: 'Mountain Time (MT)', value: 'America/Denver' },
  { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
  { label: 'Alaska Time (AKT)', value: 'America/Anchorage' },
  { label: 'Hawaii Time (HT)', value: 'Pacific/Honolulu' },
];

const loadPreferences = () => {
  if (authStore.user?.preferences) {
    preferences.value = {
      ...preferences.value,
      ...authStore.user.preferences,
    };
  }
};

const savePreferences = async () => {
  saving.value = true;
  try {
    await authStore.updatePreferences(preferences.value);
    $q.notify({ type: 'positive', message: 'Preferences saved successfully' });
  } catch (error: any) {
    $q.notify({ type: 'negative', message: error.message || 'Failed to save preferences' });
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadPreferences();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}
</style>
