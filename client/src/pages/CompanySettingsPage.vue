<template>
  <q-page class="page-container">
    <div class="text-h5 text-weight-bold q-mb-md">Company Settings</div>
    
    <q-tabs
      v-model="activeTab"
      class="text-primary q-mb-md"
      align="left"
      narrow-indicator
    >
      <q-tab name="general" label="General" />
      <q-tab name="markets" label="Markets" />
      <q-tab name="employeeIds" label="Employee IDs" />
      <q-tab name="branding" label="Branding" />
    </q-tabs>
    
    <q-tab-panels v-model="activeTab" animated>
      <!-- General Settings -->
      <q-tab-panel name="general">
        <q-card class="glass-card q-pa-lg">
          <div class="text-h6 q-mb-md">Company Information</div>
          
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="settings.name" label="Company Name" outlined />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="settings.legalName" label="Legal Name" outlined />
            </div>
          </div>
          
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="settings.taxId" label="Tax ID / EIN" outlined />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="settings.website" label="Website" outlined />
            </div>
          </div>
          
          <q-separator class="q-my-lg" />
          
          <div class="text-h6 q-mb-md">Default Settings</div>
          
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="settings.settings.defaultTimezone"
                :options="timezoneOptions"
                label="Default Timezone"
                outlined
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="settings.settings.defaultCurrency"
                :options="currencyOptions"
                label="Default Currency"
                outlined
                emit-value
                map-options
              />
            </div>
          </div>
          
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="settings.settings.defaultDateFormat"
                :options="dateFormatOptions"
                label="Default Date Format"
                outlined
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="settings.settings.defaultLanguage"
                :options="languageOptions"
                label="Default Language"
                outlined
                emit-value
                map-options
              />
            </div>
          </div>
          
          <div class="q-mt-lg">
            <q-btn color="primary" label="Save Changes" @click="saveSettings" :loading="saving" />
          </div>
        </q-card>
      </q-tab-panel>
      
      <!-- Markets -->
      <q-tab-panel name="markets">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">Markets</div>
          <q-btn color="primary" icon="add" label="Add Market" @click="openAddMarket" />
        </div>
        
        <q-table
          :rows="markets"
          :columns="marketColumns"
          row-key="_id"
          flat
          dense
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-status="{ row }">
            <q-td>
              <q-badge :color="row.status === 'active' ? 'positive' : 'grey'">
                {{ row.status }}
              </q-badge>
            </q-td>
          </template>
          
          <template v-slot:body-cell-manager="{ row }">
            <q-td>
              <span v-if="row.managerId">{{ row.managerId.firstName }} {{ row.managerId.lastName }}</span>
              <span v-else class="text-grey-7">Not assigned</span>
            </q-td>
          </template>
          
          <template v-slot:body-cell-actions="{ row }">
            <q-td class="text-right">
              <q-btn flat round icon="edit" size="sm" @click="editMarket(row)" />
              <q-btn flat round icon="delete" size="sm" color="negative" @click="confirmDeleteMarket(row)" />
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>
      
      <!-- Employee ID Configuration -->
      <q-tab-panel name="employeeIds">
        <q-card class="glass-card q-pa-lg">
          <div class="text-h6 q-mb-md">Employee ID Configuration</div>
          
          <q-item class="q-pa-none q-mb-md">
            <q-item-section>
              <q-item-label>Auto-generate Employee IDs</q-item-label>
              <q-item-label caption>Automatically assign employee IDs when creating users</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle v-model="settings.employeeIdConfig.enabled" />
            </q-item-section>
          </q-item>
          
          <template v-if="settings.employeeIdConfig.enabled">
            <q-separator class="q-my-md" />
            
            <div class="text-subtitle1 q-mb-md">ID Format</div>
            
            <q-input
              v-model="settings.employeeIdConfig.format"
              label="Format Pattern"
              outlined
              class="q-mb-md"
              hint="Use {MARKET} for market code, {ROLE} for role code, {SEQUENCE:N} for zero-padded sequence"
            />
            
            <div class="text-caption text-grey-7 q-mb-md">
              Preview: <strong>{{ idPreview }}</strong>
            </div>
            
            <q-separator class="q-my-md" />
            
            <div class="text-subtitle1 q-mb-md">Role Codes</div>
            
            <div class="row q-col-gutter-md">
              <div v-for="role in roleOptions" :key="role.value" class="col-6 col-sm-3">
                <q-input
                  v-model="roleCodes[role.value]"
                  :label="role.label"
                  outlined
                  dense
                  maxlength="4"
                  class="q-mb-sm"
                />
              </div>
            </div>
            
            <q-separator class="q-my-md" />
            
            <div class="text-subtitle1 q-mb-md">Market Codes</div>
            
            <q-table
              :rows="marketCodeRows"
              :columns="[
                { name: 'market', label: 'Market', field: 'marketName', align: 'left' },
                { name: 'code', label: 'Code', field: 'code', align: 'left' },
              ]"
              row-key="marketId"
              flat
              dense
              hide-pagination
            >
              <template v-slot:body="{ row }">
                <q-tr>
                  <q-td>{{ row.marketName }}</q-td>
                  <q-td>
                    <q-input
                      v-model="marketCodes[row.marketId]"
                      outlined
                      dense
                      maxlength="4"
                      style="width: 100px"
                    />
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </template>
          
          <div class="q-mt-lg">
            <q-btn color="primary" label="Save Configuration" @click="saveEmployeeIdConfig" :loading="saving" />
          </div>
        </q-card>
      </q-tab-panel>
      
      <!-- Branding -->
      <q-tab-panel name="branding">
        <q-card class="glass-card q-pa-lg">
          <div class="text-h6 q-mb-md">Branding</div>
          
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="settings.branding.logoUrl" label="Logo URL" outlined />
              <q-img 
                v-if="settings.branding.logoUrl" 
                :src="settings.branding.logoUrl" 
                style="height: 100px; width: 100%; object-fit: contain; margin-top: 8px;"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="settings.branding.faviconUrl" label="Favicon URL" outlined />
            </div>
          </div>
          
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="settings.branding.primaryColor" label="Primary Color" outlined>
                <template v-slot:prepend>
                  <q-icon name="colorize" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-color v-model="settings.branding.primaryColor" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="settings.branding.secondaryColor" label="Secondary Color" outlined>
                <template v-slot:prepend>
                  <q-icon name="colorize" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-color v-model="settings.branding.secondaryColor" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>
          
          <div class="q-mt-lg">
            <q-btn color="primary" label="Save Branding" @click="saveBranding" :loading="saving" />
          </div>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
    
    <!-- Add/Edit Market Dialog -->
    <q-dialog v-model="showMarketDialog" persistent>
      <q-card class="glass-card" style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ editingMarket ? 'Edit Market' : 'Add Market' }}</div>
        </q-card-section>
        
        <q-card-section class="q-gutter-md">
          <q-input v-model="marketForm.name" label="Market Name *" outlined required />
          
          <q-input 
            v-model="marketForm.code" 
            label="Market Code *" 
            outlined 
            required 
            maxlength="4"
            hint="e.g., IL, NE, TX (used in employee IDs)"
          />
          
          <q-input v-model="marketForm.region" label="Region *" outlined required hint="e.g., Midwest, Northeast" />
          
          <q-select
            v-model="marketForm.status"
            :options="[{ label: 'Active', value: 'active' }, { label: 'Planning', value: 'planning' }, { label: 'Inactive', value: 'inactive' }]"
            label="Status *"
            outlined
            emit-value
            map-options
          />
          
          <div class="text-caption text-grey-7 q-mt-sm">Address</div>
          
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input v-model="marketForm.address.street" label="Street" outlined />
            </div>
            <div class="col-6">
              <q-input v-model="marketForm.address.city" label="City" outlined />
            </div>
            <div class="col-3">
              <q-input v-model="marketForm.address.state" label="State" outlined />
            </div>
            <div class="col-3">
              <q-input v-model="marketForm.address.zip" label="ZIP" outlined />
            </div>
          </div>
          
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-6">
              <q-input v-model="marketForm.phone" label="Phone" outlined />
            </div>
            <div class="col-6">
              <q-input v-model="marketForm.email" label="Email" type="email" outlined />
            </div>
          </div>
          
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-6">
              <q-select
                v-model="marketForm.managerId"
                :options="adminUsers"
                option-value="_id"
                option-label="fullName"
                label="Market Manager"
                outlined
                emit-value
                map-options
                clearable
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="marketForm.timezone"
                :options="timezoneOptions"
                label="Timezone"
                outlined
                emit-value
                map-options
              />
            </div>
          </div>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" :label="editingMarket ? 'Save Changes' : 'Add Market'" @click="saveMarket" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { api } from '@/boot/axios';
import { useUserStore } from '@/stores/users';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const userStore = useUserStore();
const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar();

const activeTab = ref('general');
const loading = ref(false);
const saving = ref(false);
const markets = ref([]);
const settings = ref({
  name: 'Facet Renovations',
  legalName: '',
  taxId: '',
  website: '',
  settings: {
    defaultTimezone: 'America/Chicago',
    defaultCurrency: 'USD',
    defaultDateFormat: 'MM/DD/YYYY',
    defaultLanguage: 'en',
  },
  employeeIdConfig: {
    enabled: true,
    format: '{MARKET}-{ROLE}{SEQUENCE:4}',
    roleCodes: {},
    marketCodes: {},
    lastSequence: {},
  },
  branding: {
    logoUrl: '',
    primaryColor: '#1976d2',
    secondaryColor: '#26a69a',
    faviconUrl: '',
  },
});

const roleCodes = ref({});
const marketCodes = ref({});

const showMarketDialog = ref(false);
const editingMarket = ref(false);
const marketForm = ref({
  name: '',
  code: '',
  region: '',
  status: 'planning',
  address: { street: '', city: '', state: '', zip: '', country: 'USA' },
  phone: '',
  email: '',
  managerId: null,
  timezone: 'America/Chicago',
});

const adminUsers = computed(() => {
  return userStore.users.filter(u => u.roles.includes('admin')).map(u => ({
    ...u,
    fullName: `${u.firstName} ${u.lastName}`,
  }));
});

const marketColumns = [
  { name: 'name', label: 'Market', field: 'name', align: 'left', sortable: true },
  { name: 'code', label: 'Code', field: 'code', align: 'left', sortable: true },
  { name: 'region', label: 'Region', field: 'region', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'manager', label: 'Manager', field: 'manager', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
];

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Sales', value: 'sales' },
  { label: 'BDC', value: 'bdc' },
  { label: 'Warehouse', value: 'warehouse' },
  { label: 'Production', value: 'production' },
  { label: 'Installer', value: 'installer' },
  { label: 'Contractor', value: 'contractor' },
];

const timezoneOptions = [
  { label: 'Eastern (ET)', value: 'America/New_York' },
  { label: 'Central (CT)', value: 'America/Chicago' },
  { label: 'Mountain (MT)', value: 'America/Denver' },
  { label: 'Pacific (PT)', value: 'America/Los_Angeles' },
  { label: 'Alaska (AKT)', value: 'America/Anchorage' },
  { label: 'Hawaii (HT)', value: 'Pacific/Honolulu' },
];

const currencyOptions = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
];

const dateFormatOptions = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
];

const marketCodeRows = computed(() => {
  return markets.value.map(m => ({
    marketId: m._id,
    marketName: m.name,
    code: marketCodes.value[m._id] || m.code || '',
  }));
});

const idPreview = computed(() => {
  const format = settings.value.employeeIdConfig.format || '{MARKET}-{ROLE}{SEQUENCE:4}';
  const marketCode = Object.values(marketCodes.value)[0] || 'IL';
  const roleCode = Object.values(roleCodes.value)[0] || 'FRA';
  return format
    .replace('{MARKET}', marketCode)
    .replace('{ROLE}', roleCode)
    .replace('{SEQUENCE:4}', '0001');
});

const fetchSettings = async () => {
  try {
    const { data } = await api.get('/company');
    settings.value = data;
    
    // Initialize role codes
    roleCodes.value = Object.fromEntries(
      Object.entries(data.employeeIdConfig.roleCodes || {})
    );
    
    // Initialize market codes
    marketCodes.value = Object.fromEntries(
      Object.entries(data.employeeIdConfig.marketCodes || {})
    );
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    $q.notify({ type: 'negative', message: 'Failed to load company settings' });
  }
};

const fetchMarkets = async () => {
  try {
    const { data } = await api.get('/company/markets');
    markets.value = data;
  } catch (error) {
    console.error('Failed to fetch markets:', error);
    $q.notify({ type: 'negative', message: 'Failed to load markets' });
  }
};

const saveSettings = async () => {
  saving.value = true;
  try {
    await api.put('/company', settings.value);
    $q.notify({ type: 'positive', message: 'Settings saved successfully' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to save settings' });
  } finally {
    saving.value = false;
  }
};

const saveEmployeeIdConfig = async () => {
  saving.value = true;
  try {
    await api.put('/company/employee-id-config', {
      enabled: settings.value.employeeIdConfig.enabled,
      format: settings.value.employeeIdConfig.format,
      roleCodes: roleCodes.value,
      marketCodes: marketCodes.value,
    });
    $q.notify({ type: 'positive', message: 'Employee ID configuration saved' });
    await fetchSettings();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to save configuration' });
  } finally {
    saving.value = false;
  }
};

const saveBranding = async () => {
  saving.value = true;
  try {
    await api.put('/company', { branding: settings.value.branding });
    $q.notify({ type: 'positive', message: 'Branding saved successfully' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to save branding' });
  } finally {
    saving.value = false;
  }
};

const editMarket = (market: any) => {
  editingMarket.value = true;
  marketForm.value = { 
    ...market,
    address: market.address || { street: '', city: '', state: '', zip: '', country: 'USA' },
  };
  showMarketDialog.value = true;
};

const openAddMarket = () => {
  editingMarket.value = false;
  marketForm.value = {
    name: '',
    code: '',
    region: '',
    status: 'planning',
    address: { street: '', city: '', state: '', zip: '', country: 'USA' },
    phone: '',
    email: '',
    managerId: null,
    timezone: 'America/Chicago',
  };
  showMarketDialog.value = true;
};

const saveMarket = async () => {
  if (!marketForm.value.name || !marketForm.value.code || !marketForm.value.region) {
    $q.notify({ type: 'warning', message: 'Please fill in all required fields' });
    return;
  }

  saving.value = true;
  try {
    if (editingMarket.value) {
      await api.put(`/company/markets/${marketForm.value._id}`, marketForm.value);
      $q.notify({ type: 'positive', message: 'Market updated successfully' });
    } else {
      await api.post('/company/markets', marketForm.value);
      $q.notify({ type: 'positive', message: 'Market added successfully' });
    }
    showMarketDialog.value = false;
    await fetchMarkets();
    await fetchSettings(); // Refresh to get updated market codes
  } catch (error: any) {
    $q.notify({ type: 'negative', message: error.response?.data?.error || 'Failed to save market' });
  } finally {
    saving.value = false;
  }
};

const confirmDeleteMarket = (market: any) => {
  $q.dialog({
    title: 'Delete Market',
    message: `Are you sure you want to delete ${market.name}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/company/markets/${market._id}`);
      $q.notify({ type: 'positive', message: 'Market deleted' });
      await fetchMarkets();
    } catch (error: any) {
      $q.notify({ type: 'negative', message: error.response?.data?.error || 'Failed to delete market' });
    }
  });
};

onMounted(() => {
  if (!authStore.user?.roles?.includes('admin')) {
    router.push('/');
    $q.notify({ type: 'negative', message: 'Access denied - Admin only' });
    return;
  }
  fetchSettings();
  fetchMarkets();
  userStore.fetchUsers();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}
</style>
