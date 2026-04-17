<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Projects</div>
      <q-btn v-if="canCreateProject" color="primary" icon="add" label="New Project" @click="showNewProjectDialog = true" />
    </div>

    <!-- Filters -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-input v-model="projectStore.filters.search" label="Search" dense outlined clearable>
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-6 col-md-3">
        <q-select
          v-model="projectStore.filters.status"
          :options="statusOptions"
          label="Status"
          dense
          outlined
          clearable
          emit-value
          map-options
        />
      </div>
      <div class="col-6 col-md-3">
        <q-select
          v-model="projectStore.filters.assignedTo"
          :options="userStore.salesUsers"
          label="Assigned To"
          dense
          outlined
          clearable
          option-value="_id"
          option-label="firstName"
          emit-value
        />
      </div>
      <div class="col-12 col-md-2">
        <q-btn color="primary" label="Filter" @click="projectStore.fetchProjects" class="full-width" />
      </div>
    </div>

    <!-- Projects Table -->
    <q-card class="glass-card">
      <q-table :rows="projectStore.projects" :columns="columns" row-key="_id" :loading="projectStore.isLoading" dense @row-click="onRowClick" >
        <template v-slot:body-cell-status="{ row }">
          <q-td>
            <q-badge :color="statusColor(row.status)">
              {{ formatStatus(row.status) }}
            </q-badge>
          </q-td>
        </template>
        <template v-slot:body-cell-customer="{ row }">
          <q-td>
            {{ row.customerId?.firstName }} {{ row.customerId?.lastName }}
          </q-td>
        </template>
        <template v-slot:body-cell-amount="{ row }">
          <q-td class="text-right">
            ${{ row.contractAmount?.toLocaleString() || 0 }}
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- New Project Dialog -->
    <q-dialog v-model="showNewProjectDialog" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section class="row items-center">
          <div class="text-h6">New Project</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="createProject" class="q-gutter-md">
            <q-select
              v-model="newProject.customerId"
              :options="customerStore.customers"
              label="Customer"
              outlined
              required
              option-value="_id"
              option-label="lastName"
              emit-value
              use-input
              @filter="filterCustomers"
            >
              <template v-slot:option="{ itemProps, opt }">
                <q-item v-bind="itemProps">
                  <q-item-section>
                    <q-item-label>{{ opt.firstName }} {{ opt.lastName }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-input v-model="newProject.title" label="Project Title" outlined required />

            <q-select
              v-model="newProject.type"
              :options="typeOptions"
              label="Project Type"
              outlined
              required
              emit-value
              map-options
            />

            <q-input v-model="newProject.address.street" label="Street Address" outlined required />

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model="newProject.address.city" label="City" outlined required />
              </div>
              <div class="col-3">
                <q-input v-model="newProject.address.state" label="State" outlined required maxlength="2" />
              </div>
              <div class="col-3">
                <q-input v-model="newProject.address.zip" label="ZIP" outlined required />
              </div>
            </div>

            <q-input
              v-model.number="newProject.contractAmount"
              label="Contract Amount"
              type="number"
              prefix="$"
              outlined
            />

            <q-select
              v-model="newProject.assignedSalesId"
              :options="userStore.salesUsers"
              label="Assigned Sales Consultant"
              outlined
              option-value="_id"
              option-label="firstName"
              emit-value
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" flat v-close-popup />
              <q-btn label="Create" type="submit" color="primary" :loading="creating" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/projects';
import { useCustomerStore } from '@/stores/customers';
import { useUserStore } from '@/stores/users';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();
const projectStore = useProjectStore();
const customerStore = useCustomerStore();
const userStore = useUserStore();

const onRowClick = (evt, row) => router.push(`/projects/${row._id}`);

const showNewProjectDialog = ref(false);
const creating = ref(false);

const canCreateProject = computed(() => userStore.user?.roles?.some(role => ['admin', 'manager', 'sales'].includes(role)) || false);

const newProject = reactive({
  customerId: '',
  title: '',
  type: 'renovation',
  address: {
    street: '',
    city: '',
    state: 'IL',
    zip: '',
  },
  contractAmount: 0,
  assignedSalesId: '',
});

const columns = [
  { name: 'projectNumber', label: 'ID', field: 'projectNumber', align: 'left', sortable: true },
  { name: 'customer', label: 'Customer', align: 'left' },
  { name: 'title', label: 'Title', field: 'title', align: 'left', sortable: true },
  { name: 'type', label: 'Type', field: 'type', sortable: true },
  { name: 'status', label: 'Status', align: 'left', sortable: true },
  { name: 'amount', label: 'Amount', align: 'right', sortable: true },
  { name: 'leadDate', label: 'Lead Date', field: 'leadDate', format: (val: string) => new Date(val).toLocaleDateString(), sortable: true },
];

const statusOptions = [
  // Prospect
  { label: 'Lead', value: 'lead' },
  { label: 'Appointment', value: 'appointment' },
  { label: 'Rehash/Multitouch', value: 'rehash_multitouch' },
  { label: 'Contract Sent', value: 'contract_sent' },
  // Customer
  { label: 'Contract Signed', value: 'contract_signed' },
  { label: 'Initial Funding Cleared', value: 'funding_cleared' },
  { label: 'Deal Scrub - In Progress', value: 'deal_scrub_in_progress' },
  { label: 'Change Order Needed', value: 'change_order_needed' },
  { label: 'Deal Scrub - Complete', value: 'deal_scrub_complete' },
  // Production
  { label: 'Materials Ordered', value: 'materials_ordered' },
  { label: 'Materials Released', value: 'materials_released' },
  { label: 'Materials Received', value: 'materials_received' },
  // Install
  { label: 'Contacted for Install', value: 'install_contacted' },
  { label: 'Install In Progress', value: 'install_in_progress' },
  { label: 'Install Hung', value: 'install_hung' },
  { label: 'Install Complete - Service Needed', value: 'install_complete_service_needed' },
  { label: 'Install Complete', value: 'install_complete' },
  // Completed
  { label: 'Funding Received', value: 'funding_received' },
  { label: 'Completed', value: 'completed' },
];

const typeOptions = [
  { label: 'Renovation', value: 'renovation' },
  { label: 'Service', value: 'service' },
  { label: 'Warranty', value: 'warranty' },
  { label: 'Retail', value: 'retail' },
];

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(new RegExp('\\b\\w', 'g'), l => l.toUpperCase());
};

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    lead: 'grey-7',
    appointment: 'info',
    rehash_multitouch: 'info',
    contract_sent: 'warning',
    contract_signed: 'positive',
    funding_cleared: 'warning',
    deal_scrub_in_progress: 'warning',
    change_order_needed: 'warning',
    deal_scrub_complete: 'positive',
    materials_ordered: 'accent',
    materials_released: 'accent',
    materials_received: 'accent',
    install_contacted: 'secondary',
    install_in_progress: 'secondary',
    install_hung: 'secondary',
    install_complete_service_needed: 'orange',
    install_complete: 'positive',
    funding_received: 'positive',
    completed: 'positive',
    qualified: 'info',
    design_scheduled: 'primary',
    production_scheduled: 'accent',
    in_production: 'secondary',
    final_walkthrough: 'secondary',
    cancelled: 'negative',
  };
  return colors[status] || 'grey';
};

const filterCustomers = (val: string, update: any) => {
  if (val === '') {
    update(() => {
      customerStore.fetchCustomers();
    });
    return;
  }
  update(() => {
    customerStore.searchQuery = val;
    customerStore.fetchCustomers();
  });
};

const createProject = async () => {
  creating.value = true;
  try {
    const project = await projectStore.createProject(newProject);
    $q.notify({ type: 'positive', message: `Project ${project.projectNumber} created` });
    showNewProjectDialog.value = false;
    router.push(`/projects/${project._id}`);
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to create project' });
  } finally {
    creating.value = false;
  }
};

onMounted(() => {
  projectStore.fetchProjects();
  userStore.fetchUsers();
});
</script>