<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Projects</div>
      <q-btn color="primary" icon="add" label="New Project" @click="showNewProjectDialog = true" />
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
    <q-card flat bordered>
      <q-table
        :rows="projectStore.projects"
        :columns="columns"
        row-key="_id"
        :loading="projectStore.isLoading"
        flat
        dense
        @row-click="(evt, row) => $router.push(`/projects/${row._id}`)"
      >
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
      <q-card style="min-width: 500px">
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
import { ref, reactive, onMounted } from 'vue';
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

const showNewProjectDialog = ref(false);
const creating = ref(false);

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
  { label: 'Lead', value: 'lead' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Design Scheduled', value: 'design_scheduled' },
  { label: 'Contract Sent', value: 'contract_sent' },
  { label: 'Contract Signed', value: 'contract_signed' },
  { label: 'Production', value: 'in_production' },
  { label: 'Completed', value: 'completed' },
];

const typeOptions = [
  { label: 'Renovation', value: 'renovation' },
  { label: 'Service', value: 'service' },
  { label: 'Warranty', value: 'warranty' },
  { label: 'Retail', value: 'retail' },
];

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    lead: 'grey',
    qualified: 'info',
    design_scheduled: 'primary',
    contract_sent: 'warning',
    contract_signed: 'positive',
    production_scheduled: 'accent',
    in_production: 'secondary',
    completed: 'positive',
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
