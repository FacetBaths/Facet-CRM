<template>
  <q-page class="page-container">
    <div class="q-pa-md">
      <!-- Header with back button -->
      <div class="row items-center q-mb-lg">
        <q-btn flat round icon="arrow_back" color="dark" @click="$router.push('/customers')" class="q-mr-sm" />
        <div class="text-h5 text-weight-bold text-dark">Customer Profile</div>
        <q-space />
        <q-btn color="primary" icon="add" label="New Project" @click="showNewProjectDialog = true" />
      </div>

      <div class="row q-col-gutter-md">
        <!-- Customer Info Card -->
        <div class="col-12 col-md-4">
          <q-card class="glass-card" v-if="customerStore.currentCustomer">
            <q-card-section>
              <div class="text-h6 text-weight-bold text-brand-purple">
                {{ customerStore.currentCustomer.firstName }} {{ customerStore.currentCustomer.lastName }}
              </div>
              <div class="text-subtitle2 text-grey-7">
                Customer since {{ formatDate(customerStore.currentCustomer.createdAt) }}
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div class="text-subtitle2 text-weight-bold q-mb-sm">Contact Information</div>
              
              <div v-if="primaryContact" class="q-gutter-y-sm">
                <div class="row items-center" v-if="primaryContact.phone">
                  <q-icon name="phone" size="sm" class="text-grey-7 q-mr-sm" />
                  <a :href="`tel:${primaryContact.phone}`" class="text-dark">{{ primaryContact.phone }}</a>
                </div>
                <div class="row items-center" v-if="primaryContact.email">
                  <q-icon name="email" size="sm" class="text-grey-7 q-mr-sm" />
                  <a :href="`mailto:${primaryContact.email}`" class="text-dark">{{ primaryContact.email }}</a>
                </div>
                <div class="row items-start" v-if="primaryContact.address?.street">
                  <q-icon name="location_on" size="sm" class="text-grey-7 q-mr-sm" />
                  <div class="text-dark">
                    {{ primaryContact.address.street }}<br v-if="primaryContact.address.city" />
                    <span v-if="primaryContact.address.city">
                      {{ primaryContact.address.city }}, {{ primaryContact.address.state }} {{ primaryContact.address.zip }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-else class="text-grey-7">No contact information</div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div class="text-subtitle2 text-weight-bold q-mb-sm">Referral Source</div>
              <div class="text-dark">{{ customerStore.currentCustomer.referralSource || 'Not specified' }}</div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div class="text-subtitle2 text-weight-bold q-mb-sm">Notes</div>
              <q-input
                v-model="customerNotes"
                type="textarea"
                filled
                dense
                rows="4"
                placeholder="Add notes about this customer..."
              />
              <q-btn 
                label="Save Notes" 
                color="primary" 
                size="sm" 
                class="q-mt-sm"
                :loading="savingNotes"
                @click="saveNotes"
              />
            </q-card-section>
          </q-card>

          <q-skeleton v-else type="card" height="400px" />
        </div>

        <!-- Projects History -->
        <div class="col-12 col-md-8">
          <q-card class="glass-card">
            <q-card-section>
              <div class="row items-center justify-between">
                <div class="text-h6 text-weight-bold text-brand-purple">Projects History</div>
                <div class="text-subtitle2">
                  {{ customerStore.customerProjects.length }} project(s)
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <q-list v-if="customerStore.customerProjects.length > 0">
                <q-item
                  v-for="project in customerStore.customerProjects"
                  :key="project._id"
                  clickable
                  @click="$router.push(`/projects/${project._id}`)"
                  class="project-item"
                >
                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ project.projectNumber }} - {{ project.title }}
                    </q-item-label>
                    <q-item-label caption>
                      <span :class="`text-${getStatusColor(project.status)}`">
                        {{ formatStatus(project.status) }}
                      </span>
                      • {{ formatDate(project.createdAt) }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <div class="text-weight-bold text-brand-purple">
                      ${{ (project.contractAmount || 0).toLocaleString() }}
                    </div>
                    <q-badge :color="getStatusColor(project.status)" class="q-mt-xs">
                      {{ project.type }}
                    </q-badge>
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-else-if="customerStore.projectsLoading" class="text-center q-pa-lg">
                <q-spinner color="primary" size="40px" />
              </div>

              <div v-else class="text-center q-pa-xl text-grey-7">
                <q-icon name="folder_open" size="48px" class="q-mb-md" />
                <div>No projects yet</div>
                <q-btn color="primary" label="Create First Project" class="q-mt-md" @click="showNewProjectDialog = true" />
              </div>
            </q-card-section>
          </q-card>

          <!-- Communication History -->
          <q-card class="glass-card q-mt-md">
            <q-card-section>
              <div class="text-h6 text-weight-bold text-brand-purple">Communication Log</div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div class="text-center q-pa-lg text-grey-7">
                <q-icon name="chat" size="48px" class="q-mb-md" />
                <div>Communication log coming soon</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- New Project Dialog -->
    <q-dialog v-model="showNewProjectDialog" persistent maximized>
      <q-card class="glass-card">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Create New Project</div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <q-form @submit="createProject" class="q-gutter-md">
            <!-- Project Type -->
            <div class="text-subtitle2 text-weight-bold">Project Type</div>
            <div class="row q-gutter-sm">
              <q-radio v-model="newProject.type" val="renovation" label="Renovation" color="primary" />
              <q-radio v-model="newProject.type" val="service" label="Service" color="primary" />
              <q-radio v-model="newProject.type" val="warranty" label="Warranty" color="primary" />
              <q-radio v-model="newProject.type" val="retail" label="Retail" color="primary" />
            </div>

            <!-- Project Title -->
            <q-input
              v-model="newProject.title"
              label="Project Title"
              outlined
              required
              :rules="[val => !!val || 'Title is required']"
            />

            <!-- Project Description -->
            <q-input
              v-model="newProject.description"
              label="Description"
              type="textarea"
              outlined
              rows="3"
            />

            <!-- Project Address -->
            <div class="text-subtitle2 text-weight-bold q-mt-md">Project Address</div>
            <q-toggle
              v-model="useCustomerAddress"
              label="Use customer's primary address"
              color="primary"
              class="q-mb-sm"
            />
            
            <q-input
              v-model="newProject.address.street"
              label="Street Address"
              outlined
              required
              :disable="useCustomerAddress"
            />
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model="newProject.address.city"
                  label="City"
                  outlined
                  required
                  :disable="useCustomerAddress"
                />
              </div>
              <div class="col-3">
                <q-input
                  v-model="newProject.address.state"
                  label="State"
                  outlined
                  required
                  maxlength="2"
                  :disable="useCustomerAddress"
                />
              </div>
              <div class="col-3">
                <q-input
                  v-model="newProject.address.zip"
                  label="ZIP"
                  outlined
                  required
                  :disable="useCustomerAddress"
                />
              </div>
            </div>

            <!-- Contract Value -->
            <q-input
              v-model.number="newProject.contractAmount"
              label="Contract Amount"
              type="number"
              prefix="$"
              outlined
            />

            <!-- Assigned Sales -->
            <q-select
              v-model="newProject.assignedSalesId"
              :options="userStore.users"
              option-value="_id"
              option-label="fullName"
              label="Assigned Sales"
              outlined
              emit-value
              map-options
            />

            <!-- Source -->
            <q-input
              v-model="newProject.source"
              label="Lead Source"
              outlined
              placeholder="e.g., Website, Referral, Walk-in"
            />

            <div class="row justify-end q-gutter-sm q-mt-lg">
              <q-btn label="Cancel" flat v-close-popup />
              <q-btn
                label="Create Project"
                type="submit"
                color="primary"
                :loading="creatingProject"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useCustomerStore } from '@/stores/customers';
import { useUserStore } from '@/stores/users';
import { api } from '@/boot/axios';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const customerStore = useCustomerStore();
const userStore = useUserStore();

const customerId = computed(() => route.params.id as string);
const customerNotes = ref('');
const savingNotes = ref(false);
const showNewProjectDialog = ref(false);
const creatingProject = ref(false);
const useCustomerAddress = ref(true);

const newProject = ref({
  customerId: '',
  type: 'renovation',
  title: '',
  description: '',
  address: {
    street: '',
    city: '',
    state: 'IL',
    zip: '',
  },
  contractAmount: 17500,
  assignedSalesId: null as string | null,
  source: '',
});

const primaryContact = computed(() => {
  if (!customerStore.currentCustomer?.contacts?.length) return null;
  return customerStore.currentCustomer.contacts[0];
});

// Auto-fill address when toggled
watch(useCustomerAddress, (val) => {
  if (val && primaryContact.value?.address) {
    newProject.value.address = { ...primaryContact.value.address };
  }
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    lead: 'grey',
    qualified: 'blue',
    design_scheduled: 'purple',
    contract_sent: 'orange',
    contract_signed: 'positive',
    production_scheduled: 'accent',
    in_production: 'secondary',
    completed: 'positive',
    cancelled: 'negative',
  };
  return colors[status] || 'grey';
};

const saveNotes = async () => {
  if (!customerStore.currentCustomer) return;
  
  savingNotes.value = true;
  try {
    await customerStore.updateCustomer(customerId.value, {
      ...customerStore.currentCustomer,
      notes: customerNotes.value,
    });
    $q.notify({ type: 'positive', message: 'Notes saved' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to save notes' });
  } finally {
    savingNotes.value = false;
  }
};

const createProject = async () => {
  creatingProject.value = true;
  try {
    const contractAmount = newProject.value.contractAmount || 17500;
    
    const projectData = {
      ...newProject.value,
      customerId: customerId.value,
      lineItems: [],
      tasks: [],
      activities: [],
      changeOrders: [],
      expenses: [],
      payments: [],
      status: 'lead',
      paymentTerms: {
        type: 'standard',
        total: contractAmount,
        milestones: generateMilestones(contractAmount),
      },
    };

    const { data } = await api.post('/projects', projectData);
    
    $q.notify({ 
      type: 'positive', 
      message: `Project ${data.projectNumber} created successfully` 
    });
    
    showNewProjectDialog.value = false;
    
    // Refresh projects list
    await customerStore.fetchCustomerProjects(customerId.value);
    
    // Navigate to the new project
    router.push(`/projects/${data._id}`);
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to create project' });
  } finally {
    creatingProject.value = false;
  }
};

const generateMilestones = (total: number) => {
  return [
    { percent: 25, label: 'Design Deposit', required: true, completed: false },
    { percent: 50, label: 'Materials Release', required: true, completed: false },
    { percent: 75, label: 'Production Start', required: true, completed: false },
    { percent: 100, label: 'Final Payment', required: true, completed: false },
  ];
};

// Initialize
onMounted(async () => {
  if (customerId.value) {
    await customerStore.fetchCustomer(customerId.value);
    await customerStore.fetchCustomerProjects(customerId.value);
    await userStore.fetchUsers();
    
    if (customerStore.currentCustomer?.notes) {
      customerNotes.value = customerStore.currentCustomer.notes;
    }

    // Pre-fill with customer address if available
    if (primaryContact.value?.address) {
      newProject.value.address = { ...primaryContact.value.address };
    }
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

.project-item {
  border-radius: 8px;
  margin: 4px 0;
  transition: all 0.2s ease;
}

.project-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
