<template>
  <q-page class="page-container">
    <div class="q-pa-md">
      <!-- Header -->
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h5 text-weight-bold text-dark">Commission Dashboard</div>
        <q-btn color="primary" icon="settings" label="Manage Rules" @click="showRulesDialog = true" />
      </div>

      <!-- Summary Cards -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-4">
          <q-card class="glass-card">
            <q-card-section class="text-center">
              <div class="text-h6 text-grey-7">Total Earned</div>
              <div class="text-h4 text-weight-bold text-brand-purple">${{ commissionStore.totals.earned.toLocaleString() }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card class="glass-card">
            <q-card-section class="text-center">
              <div class="text-h6 text-grey-7">Paid Out</div>
              <div class="text-h4 text-weight-bold text-positive">${{ commissionStore.totals.paid.toLocaleString() }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card class="glass-card">
            <q-card-section class="text-center">
              <div class="text-h6 text-grey-7">Outstanding</div>
              <div class="text-h4 text-weight-bold text-negative">${{ commissionStore.totals.unpaid.toLocaleString() }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Users Table -->
      <q-card class="glass-card">
        <q-card-section>
          <div class="text-h6 text-weight-bold text-brand-purple">Commission by Person</div>
        </q-card-section>

        <q-separator />

        <q-table
          :rows="commissionStore.users"
          :columns="columns"
          :loading="commissionStore.isLoading"
          row-key="userId"
          flat
          dense
        >
          <template v-slot:body-cell-name="{ row }">
            <q-td>
              <div class="text-weight-medium">{{ row.name }}</div>
              <div class="text-caption text-grey-7">{{ formatRole(row.role) }}</div>
            </q-td>
          </template>

          <template v-slot:body-cell-settings="{ row }">
            <q-td>
              <div v-if="row.role === 'sales' || row.role === 'design_consultant'">
                <q-badge :color="row.commissionSettings?.useFlatRate ? 'orange' : 'positive'" class="q-mr-sm">
                  {{ row.commissionSettings?.useFlatRate ? '$400 Flat' : '10%' }}
                </q-badge>
              </div>
              <div v-else-if="row.role === 'bdc'">1%</div>
              <div v-else-if="row.role === 'admin'">{{ row.isOwner ? '3%' : '2%' }}</div>
              <div v-else class="text-grey-7">-</div>
            </q-td>
          </template>

          <template v-slot:body-cell-earned="{ row }">
            <q-td class="text-weight-bold">${{ row.earned.toLocaleString() }}</q-td>
          </template>

          <template v-slot:body-cell-paid="{ row }">
            <q-td class="text-positive">${{ row.paid.toLocaleString() }}</q-td>
          </template>

          <template v-slot:body-cell-unpaid="{ row }">
            <q-td class="text-negative text-weight-bold">${{ row.unpaid.toLocaleString() }}</q-td>
          </template>

          <template v-slot:body-cell-actions="{ row }">
            <q-td>
              <q-btn flat round icon="visibility" color="primary" @click="viewUserDetail(row)">
                <q-tooltip>View Details</q-tooltip>
              </q-btn>
              <q-btn flat round icon="edit" color="secondary" @click="editSettings(row)">
                <q-tooltip>Edit Settings</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Rules Management Dialog -->
    <q-dialog v-model="showRulesDialog" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Commission Rules</div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <div class="text-subtitle1 text-weight-bold">Sales / Design Consultants</div>
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input
                v-model.number="editableRules.sales.percentage"
                label="Percentage Rate (%)"
                type="number"
                outlined
                suffix="%"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="editableRules.sales.flatAmount"
                label="Flat Amount"
                type="number"
                outlined
                prefix="$"
              />
            </div>
          </div>
          <q-input
            v-model.number="editableRules.sales.threshold"
            label="Threshold for Percentage ($)"
            type="number"
            outlined
            prefix="$"
            hint="Below this = flat rate"
          />

          <q-separator class="q-my-md" />

          <div class="text-subtitle1 text-weight-bold">BDC (Call Center)</div>
          <q-input
            v-model.number="editableRules.bdc.percentage"
            label="BDC Commission (%)"
            type="number"
            outlined
            suffix="%"
            hint="Of total contract value"
          />

          <q-separator class="q-my-md" />

          <div class="text-subtitle1 text-weight-bold">Admin Commission</div>
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input
                v-model.number="editableRules.admin.owner"
                label="Owners (%)"
                type="number"
                outlined
                suffix="%"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="editableRules.admin.standard"
                label="Standard Admin (%)"
                type="number"
                outlined
                suffix="%"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="Cancel" flat v-close-popup />
          <q-btn label="Save Rules" color="primary" @click="saveRules" :loading="savingRules" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- User Settings Dialog -->
    <q-dialog v-model="showSettingsDialog" persistent>
      <q-card style="min-width: 400px" class="glass-card" v-if="selectedUser">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Commission Settings: {{ selectedUser.name }}</div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <div v-if="selectedUser.role === 'sales' || selectedUser.role === 'design_consultant'">
            <q-toggle
              v-model="userSettings.useFlatRate"
              label="Use flat rate ($400) instead of 10%"
              color="primary"
            />

            <div class="text-caption text-grey-7 q-mt-sm">
              {{ userSettings.useFlatRate ? 'Will earn $400 flat per project' : 'Will earn 10% of contract value' }}
            </div>
          </div>

          <div v-else-if="selectedUser.role === 'admin'">
            <q-toggle
              v-model="userSettings.isOwner"
              label="Is Owner (3% vs 2%)"
              color="primary"
            />
          </div>

          <div v-else class="text-grey-7 text-center q-pa-md">
            No settings available for this role.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="Cancel" flat v-close-popup />
          <q-btn label="Save" color="primary" @click="saveSettings" :loading="savingSettings" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- User Detail Dialog -->
    <q-dialog v-model="showDetailDialog" full-width>
      <q-card class="glass-card">
        <q-card-section class="row items-center justify-between">
          <div v-if="commissionStore.userDetail?.user">
            <div class="text-h6">{{ commissionStore.userDetail.user.name }}</div>
            <div class="text-subtitle2 text-grey-7">{{ formatRole(commissionStore.userDetail.user.role) }}</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-4">
              <div class="text-subtitle2 text-grey-7">Earned</div>
              <div class="text-h6 text-weight-bold">${{ commissionStore.userDetail?.totals.earned.toLocaleString() }}</div>
            </div>
            <div class="col-4">
              <div class="text-subtitle2 text-grey-7">Paid</div>
              <div class="text-h6 text-weight-bold text-positive">${{ commissionStore.userDetail?.totals.paid.toLocaleString() }}</div>
            </div>
            <div class="col-4">
              <div class="text-subtitle2 text-grey-7">Outstanding</div>
              <div class="text-h6 text-weight-bold text-negative">${{ commissionStore.userDetail?.totals.unpaid.toLocaleString() }}</div>
            </div>
          </div>

          <q-table
            :rows="commissionStore.userDetail?.commissions || []"
            :columns="detailColumns"
            row-key="projectId"
            flat
            dense
          >
            <template v-slot:body-cell-paid="{ row }">
              <q-td>
                <q-badge :color="row.paid ? 'positive' : 'negative'">
                  {{ row.paid ? 'Paid' : 'Unpaid' }}
                </q-badge>
                <div v-if="row.paidDate" class="text-caption text-grey-7">
                  {{ formatDate(row.paidDate) }}
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useCommissionStore } from '@/stores/commissions';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const commissionStore = useCommissionStore();

const showRulesDialog = ref(false);
const showSettingsDialog = ref(false);
const showDetailDialog = ref(false);
const selectedUser = ref<any>(null);
const savingRules = ref(false);
const savingSettings = ref(false);

const editableRules = reactive({
  sales: {
    percentage: 10,
    flatAmount: 400,
    threshold: 4000,
  },
  bdc: {
    percentage: 1,
  },
  admin: {
    owner: 3,
    standard: 2,
  },
});

const userSettings = reactive({
  useFlatRate: false,
  flatAmount: 400,
  percentageRate: 10,
  threshold: 4000,
  isOwner: false,
});

const columns = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'settings', label: 'Settings', align: 'left' },
  { name: 'projectCount', label: 'Projects', field: 'projectCount', align: 'center' },
  { name: 'earned', label: 'Earned', align: 'right' },
  { name: 'paid', label: 'Paid', align: 'right' },
  { name: 'unpaid', label: 'Outstanding', align: 'right' },
  { name: 'actions', label: 'Actions', align: 'center' },
];

const detailColumns = [
  { name: 'projectNumber', label: 'Project', field: 'projectNumber', align: 'left' },
  { name: 'customerName', label: 'Customer', field: 'customerName', align: 'left' },
  { name: 'contractAmount', label: 'Contract', field: 'contractAmount', align: 'right', format: (v: number) => `$${v?.toLocaleString()}` },
  { name: 'amount', label: 'Commission', field: 'amount', align: 'right', format: (v: number) => `$${v?.toLocaleString()}` },
  { name: 'paid', label: 'Status', align: 'center' },
];

const formatRole = (role: string) => {
  const labels: Record<string, string> = {
    sales: 'Sales Rep',
    design_consultant: 'Design Consultant',
    bdc: 'BDC Rep',
    admin: 'Admin',
  };
  return labels[role] || role;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const viewUserDetail = async (user: any) => {
  selectedUser.value = user;
  await commissionStore.fetchUserDetail(user.userId);
  showDetailDialog.value = true;
};

const editSettings = (user: any) => {
  selectedUser.value = user;
  
  // Load current settings
  if (user.commissionSettings) {
    Object.assign(userSettings, user.commissionSettings);
  }
  
  showSettingsDialog.value = true;
};

const saveSettings = async () => {
  if (!selectedUser.value) return;
  
  savingSettings.value = true;
  try {
    await commissionStore.updateSettings(selectedUser.value.userId, { ...userSettings });
    $q.notify({ type: 'positive', message: 'Settings saved' });
    showSettingsDialog.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to save settings' });
  } finally {
    savingSettings.value = false;
  }
};

const saveRules = async () => {
  savingRules.value = true;
  try {
    await commissionStore.updateRules({
      sales: { ...editableRules.sales },
      bdc: { ...editableRules.bdc },
      admin: { ...editableRules.admin },
    });
    $q.notify({ type: 'positive', message: 'Rules updated' });
    showRulesDialog.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to update rules' });
  } finally {
    savingRules.value = false;
  }
};

onMounted(() => {
  commissionStore.fetchDashboard();
  
  // Load rules into editable form
  if (commissionStore.rules) {
    Object.assign(editableRules, commissionStore.rules);
  }
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #9945ff, #ffffff, #14f195);
  background-size: 400% 400%;
  animation: gradientAnimation 15s ease infinite;
}

@keyframes gradientAnimation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.glass-card {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
</style>
