<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">PnL Report</div>

    <!-- Filters -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-3">
        <q-input v-model="filters.dateRange.start" label="Start Date" type="date" dense outlined />
      </div>
      <div class="col-12 col-md-3">
        <q-input v-model="filters.dateRange.end" label="End Date" type="date" dense outlined />
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="filters.status"
          :options="statusOptions"
          label="Status"
          dense
          outlined
          clearable
          emit-value
          map-options
        />
      </div>
      <div class="col-12 col-md-3">
        <q-btn color="primary" label="Apply Filters" @click="fetchPnL" class="full-width" />
      </div>
    </div>

    <!-- PnL Table -->
    <q-card v-if="isAuthorized" class="glass-card">\n      <q-table :rows="pnlStore.pnlReports" :columns="columns" row-key="projectId" :loading="pnlStore.isLoading" dense >\n        <template v-slot:body-cell-profit="{ row }">\n          <q-td :class="row.profit >= 0 ? 'text-positive' : 'text-negative'">\n            ${{ row.profit.toLocaleString() }}\n          </q-td>\n        </template>\n      </q-table>\n    </q-card><div v-else class="text-negative q-mt-md">You do not have permission to view PnL reports.</div>

    <div v-if="pnlStore.error" class="text-negative q-mt-md">
      {{ pnlStore.error }}
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { usePnlStore } from '@/stores/pnlStore';
import { useUserStore } from '@/stores/users';

const pnlStore = usePnlStore();
const userStore = useUserStore();
const filters = ref(pnlStore.filters);
const isAuthorized = computed(() => userStore.user?.roles?.some(role => ['admin', 'manager'].includes(role)) || false);

const columns = [
  { name: 'projectNumber', label: 'Project #', field: 'projectNumber', sortable: true },
  { name: 'status', label: 'Status', field: 'status', sortable: true },
  { name: 'contractAmount', label: 'Contract', field: 'contractAmount', format: (val: number) => `$${val.toLocaleString()}`, sortable: true },
  { name: 'totalPayments', label: 'Payments', field: 'totalPayments', format: (val: number) => `$${val.toLocaleString()}`, sortable: true },
  { name: 'totalExpenses', label: 'Expenses', field: 'totalExpenses', format: (val: number) => `$${val.toLocaleString()}`, sortable: true },
  { name: 'profit', label: 'Profit/Loss', field: 'profit', sortable: true },
];

const statusOptions = [
  // Similar to ProjectsPage, add relevant statuses
  { label: 'Completed', value: 'completed' },
  { label: 'In Progress', value: 'in_progress' },
  // Add more as needed
];

const fetchPnL = () => {
  pnlStore.filters = { ...filters.value };
  pnlStore.fetchPnL();
};

onMounted(() => {
  fetchPnL();
});
</script>