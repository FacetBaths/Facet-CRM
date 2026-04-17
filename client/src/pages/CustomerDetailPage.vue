<template>
  <q-page class="page-container" v-if="customer">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <q-btn flat icon="arrow_back" label="Back" @click="$router.push('/customers')" />
      <div class="text-h5 text-weight-bold">{{ fullName }}</div>
      <q-btn color="primary" icon="edit" label="Edit" @click="showEdit = true" />
    </div>

    <div class="row q-col-gutter-md">
      <!-- Left Column: Customer Info -->
      <div class="col-12 col-md-4">
        <!-- Customer Profile Card -->
        <div class="glass-card q-pa-md q-mb-md">
          <div class="text-h6 text-weight-bold q-mb-md">Customer Profile</div>
          
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-icon name="person" size="20px" />
            <span class="text-weight-medium">{{ fullName }}</span>
          </div>
          
          <div v-if="customer.contacts?.[0]" class="column q-gutter-sm">
            <div class="row items-center q-gutter-sm">
              <q-icon name="phone" size="20px" />
              <a :href="`tel:${customer.contacts[0].phone}`" class="text-primary">
                {{ customer.contacts[0].phone }}
              </a>
            </div>
            
            <div class="row items-center q-gutter-sm">
              <q-icon name="email" size="20px" />
              <a :href="`mailto:${customer.contacts[0].email}`" class="text-primary">
                {{ customer.contacts[0].email }}
              </a>
            </div>
            
            <div v-if="customer.contacts[0].address" class="row items-start q-gutter-sm">
              <q-icon name="location_on" size="20px" />
              <span>{{ formatAddress(customer.contacts[0].address) }}</span>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div v-if="customer.referralSource" class="row items-center q-gutter-sm">
            <q-icon name="share" size="20px" />
            <span class="text-grey-7">Referred by:</span>
            <span>{{ customer.referralSource }}</span>
          </div>

          <div v-if="customer.notes" class="q-mt-md">
            <div class="text-caption text-grey-7 q-mb-xs">Notes</div>
            <div class="text-body2">{{ customer.notes }}</div>
          </div>
        </div>

        <!-- Customer Stats -->
        <div class="glass-card q-pa-md q-mb-md">
          <div class="text-subtitle2 text-grey-7 q-mb-sm">Customer Stats</div>
          
          <div class="row justify-between items-center q-mb-sm">
            <span>Total Projects:</span>
            <span class="text-h6 text-weight-bold">{{ projects.length }}</span>
          </div>
          
          <div class="row justify-between items-center q-mb-sm">
            <span>Active Projects:</span>
            <span class="text-h6 text-weight-bold text-primary">{{ activeProjects.length }}</span>
          </div>
          
          <div class="row justify-between items-center q-mb-sm">
            <span>Total Revenue:</span>
            <span class="text-h6 text-weight-bold text-secondary">${{ totalRevenue.toLocaleString() }}</span>
          </div>
          
          <div class="row justify-between items-center">
            <span>Total Paid:</span>
            <span class="text-h6 text-weight-bold text-positive">${{ totalPaid.toLocaleString() }}</span>
          </div>

          <q-separator class="q-my-md" />

          <div class="row justify-between items-center">
            <span>Outstanding Balance:</span>
            <span class="text-h6 text-weight-bold" :class="balance > 0 ? 'text-negative' : 'text-positive'">
              ${{ balance.toLocaleString() }}
            </span>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="glass-card q-pa-md">
          <div class="text-subtitle2 text-grey-7 q-mb-sm">Actions</div>
          <div class="column q-gutter-sm">
            <q-btn color="primary" icon="add" label="New Project" @click="createProject" unelevated />
            <q-btn color="secondary" icon="note_add" label="Add Note" @click="showAddNote = true" unelevated />
            <q-btn color="info" icon="email" label="Send Email" @click="showEmailComposer = true" unelevated />
          </div>
        </div>
      </div>

      <!-- Right Column: Projects & Activity -->
      <div class="col-12 col-md-8">
        <!-- Current/Most Recent Project -->
        <div v-if="currentProject" class="glass-card q-pa-md q-mb-md">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6 text-weight-bold">Current Project</div>
            <q-btn 
              flat 
              color="primary" 
              label="View Details" 
              @click="$router.push(`/projects/${currentProject._id}`)" 
            />
          </div>

          <div class="row items-center justify-between">
            <div>
              <div class="text-weight-bold">{{ currentProject.title }}</div>
              <div class="text-caption text-grey-7">{{ currentProject.projectNumber }}</div>
            </div>
            <q-badge :color="statusColor(currentProject.status)" class="q-px-md q-py-sm">
              {{ formatStatus(currentProject.status) }}
            </q-badge>
          </div>

          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-4">
              <div class="text-caption text-grey-7">Contract</div>
              <div class="text-body2 text-weight-bold">${{ currentProject.contractAmount?.toLocaleString() }}</div>
            </div>
            <div class="col-4">
              <div class="text-caption text-grey-7">Paid</div>
              <div class="text-body2 text-weight-bold text-positive">
                ${{ getProjectPaid(currentProject).toLocaleString() }}
              </div>
            </div>
            <div class="col-4">
              <div class="text-caption text-grey-7">Balance</div>
              <div class="text-body2 text-weight-bold">${{ getProjectBalance(currentProject).toLocaleString() }}</div>
            </div>
          </div>

          <q-linear-progress
            :value="getProjectProgress(currentProject)"
            size="8px"
            rounded
            color="secondary"
            track-color="grey-4"
            class="q-mt-md"
          />
        </div>

        <!-- Customer Activity Feed (synced with current project) -->
        <div class="glass-card q-pa-md q-mb-md">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6 text-weight-bold">Activity Feed</div>
            <div v-if="currentProject" class="text-caption text-grey-7">
              Synced with {{ currentProject.projectNumber }}
            </div>
          </div>

          <div v-if="customerActivities.length === 0" class="text-center text-grey-7 q-pa-md">
            <q-icon name="chat" size="40px" class="q-mb-sm" />
            <div>No activity yet</div>
          </div>

          <q-timeline v-else color="primary">
            <q-timeline-entry
              v-for="activity in customerActivities"
              :key="activity._id || activity.timestamp"
              :title="activityTitle(activity)"
              :subtitle="formatDate(activity.timestamp)"
              :color="activityColor(activity.type)"
              :icon="activityIcon(activity.type)"
            >
              <div v-if="activity.content" class="text-body2">{{ activity.content }}</div>
              <div v-if="activity.userId" class="text-caption text-grey-7 q-mt-xs">
                by {{ activity.userId.firstName }} {{ activity.userId.lastName }}
              </div>
            </q-timeline-entry>
          </q-timeline>
        </div>

        <!-- All Projects List -->
        <div class="glass-card q-pa-md">
          <div class="text-h6 text-weight-bold q-mb-md">All Projects</div>

          <q-table
            :rows="projects"
            :columns="projectColumns"
            row-key="_id"
            flat
            dense
            :pagination="{ rowsPerPage: 10 }"
            @row-click="(evt, row) => $router.push(`/projects/${row._id}`)"
          >
            <template #body-cell-status="{ row }">
              <q-td>
                <q-badge :color="statusColor(row.status)">
                  {{ formatStatus(row.status) }}
                </q-badge>
              </q-td>
            </template>

            <template #body-cell-amount="{ row }">
              <q-td class="text-right">
                ${{ row.contractAmount?.toLocaleString() }}
              </q-td>
            </template>

            <template #body-cell-balance="{ row }">
              <q-td class="text-right">
                <span :class="getProjectBalance(row) > 0 ? 'text-negative' : 'text-positive'">
                  ${{ getProjectBalance(row).toLocaleString() }}
                </span>
              </q-td>
            </template>
           </q-table>
         </div>

         <!-- Audit Trail -->
         <div class="glass-card q-pa-md q-mt-md">
           <audit-trail 
             :audit-logs="customer.auditTrail || []" 
             @refresh="refreshAuditTrail"
             @user-click="showUserDetail"
           />
         </div>
       </div>
     </div>

    <!-- Edit Customer Dialog -->
    <q-dialog v-model="showEdit">
      <q-card class="glass-card" style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Edit Customer</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="saveCustomer">
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input v-model="editForm.firstName" label="First Name" outlined required />
              </div>
              <div class="col-6">
                <q-input v-model="editForm.lastName" label="Last Name" outlined required />
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-6">
                <q-input v-model="editForm.phone" label="Phone" outlined type="tel" />
              </div>
              <div class="col-6">
                <q-input v-model="editForm.email" label="Email" outlined type="email" />
              </div>
            </div>

            <q-input v-model="editForm.address" label="Address" outlined class="q-mt-md" />
            
            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-6">
                <q-input v-model="editForm.city" label="City" outlined />
              </div>
              <div class="col-3">
                <q-input v-model="editForm.state" label="State" outlined maxlength="2" />
              </div>
              <div class="col-3">
                <q-input v-model="editForm.zip" label="ZIP" outlined />
              </div>
            </div>

            <q-input 
              v-model="editForm.referralSource" 
              label="Referral Source" 
              outlined 
              class="q-mt-md" 
            />

            <q-input 
              v-model="editForm.notes" 
              label="Notes" 
              outlined 
              type="textarea" 
              class="q-mt-md" 
            />

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn color="primary" label="Save" type="submit" :loading="saving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Add Note Dialog -->
    <q-dialog v-model="showAddNote">
      <q-card class="glass-card" style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add Customer Note</div>
          <div v-if="currentProject" class="text-caption text-grey-7">
            Will be added to {{ currentProject.projectNumber }}
          </div>
        </q-card-section>
        <q-card-section>
          <q-input 
            v-model="newNote" 
            label="Note" 
            outlined 
            type="textarea" 
            required 
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Add Note" @click="addNote" :loading="adding" />
         </q-card-actions>
       </q-card>
     </q-dialog>

     <!-- User Detail Modal -->
     <q-dialog v-model="showUserDetailModal">
       <q-card style="min-width: 400px; max-width: 500px" class="glass-card" v-if="selectedUser">
         <q-card-section class="text-center q-pt-lg">
           <user-avatar
             :user="selectedUser"
             size="xl"
             :clickable="false"
             :show-tooltip="false"
             class="q-mb-md"
           />
           
           <div class="text-h5 text-weight-bold">
             {{ selectedUser.firstName }} {{ selectedUser.lastName }}
           </div>
           
           <div class="text-caption text-grey-7 q-mb-sm" v-if="selectedUser.employeeId">
             {{ selectedUser.employeeId }}
           </div>
           
           <div class="q-mb-md">
             <q-badge
               v-for="role in selectedUser.roles"
               :key="role"
               :color="roleColor(role)"
               class="q-mr-xs"
             >
               {{ formatRole(role) }}
             </q-badge>
           </div>
         </q-card-section>

         <q-card-section>
           <q-list dense>
             <q-item v-if="selectedUser.email">
               <q-item-section avatar>
                 <q-icon name="email" color="primary" />
               </q-item-section>
               <q-item-section>
                 <q-item-label>{{ selectedUser.email }}</q-item-label>
               </q-item-section>
               <q-item-section side>
                 <q-btn flat round icon="content_copy" size="sm" @click="copyText(selectedUser.email)" />
               </q-item-section>
             </q-item>
             
             <q-item v-if="selectedUser.phone">
               <q-item-section avatar>
                 <q-icon name="phone" color="positive" />
               </q-item-section>
               <q-item-section>
                 <q-item-label>{{ selectedUser.phone }}</q-item-label>
                 <q-item-label v-if="selectedUser.phoneExtension" caption>ext. {{ selectedUser.phoneExtension }}</q-item-label>
               </q-item-section>
               <q-item-section side>
                 <q-btn flat round icon="content_copy" size="sm" @click="copyText(selectedUser.phone)" />
               </q-item-section>
             </q-item>
             
             <q-item v-if="selectedUser.department">
               <q-item-section avatar>
                 <q-icon name="business" color="accent" />
               </q-item-section>
               <q-item-section>
                 <q-item-label>{{ selectedUser.department }}</q-item-label>
               </q-item-section>
             </q-item>
             
             <q-item v-if="selectedUser.marketId?.name || selectedUser.marketId?.code || selectedUser.marketId">
               <q-item-section avatar>
                 <q-icon name="place" color="warning" />
               </q-item-section>
               <q-item-section>
                 <q-item-label>{{ selectedUser.marketId?.name || selectedUser.marketId?.code || 'Market ' + selectedUser.marketId }}</q-item-label>
               </q-item-section>
             </q-item>

             <q-item v-if="selectedUser.employmentType">
               <q-item-section avatar>
                 <q-icon name="work" color="info" />
               </q-item-section>
               <q-item-section>
                 <q-item-label>{{ formatEmploymentType(selectedUser.employmentType) }}</q-item-label>
               </q-item-section>
             </q-item>

             <q-item v-if="selectedUser.commissionTier">
               <q-item-section avatar>
                 <q-icon name="attach_money" color="positive" />
               </q-item-section>
               <q-item-section>
                 <q-item-label>Commission Tier {{ selectedUser.commissionTier }}</q-item-label>
               </q-item-section>
             </q-item>

             <q-item v-if="selectedUser.bio">
               <q-item-section>
                 <q-item-label class="text-grey-7" style="white-space: pre-wrap">{{ selectedUser.bio }}</q-item-label>
               </q-item-section>
             </q-item>
           </q-list>
         </q-card-section>

         <q-card-actions align="right" class="q-pa-md">
           <q-btn flat label="Close" v-close-popup />
           <q-btn
             v-if="selectedUser._id !== authStore.user?._id"
             color="primary"
             icon="chat"
             label="Ping"
             @click="showUserDetailModal = false; $q.notify({type: 'info', message: 'Ping feature coming soon'})"
           />
         </q-card-actions>
       </q-card>
     </q-dialog>

     <email-composer
       v-model="showEmailComposer"
       :entityId="route.params.id"
       entityType="customer"
       :recipient="customer.contacts?.[0]?.email"
     />
  </q-page>

  <q-page v-else class="flex flex-center">
    <q-spinner size="50px" color="primary" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import EmailComposer from '@/components/EmailComposer.vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useCustomerStore } from '@/stores/customers';
import { useProjectStore } from '@/stores/projects';
import { socket, connectSocket, joinProjectRoom, leaveProjectRoom } from '@/boot/socket';
import { useAuthStore } from '@/stores/auth';
import AuditTrail from '@/components/AuditTrail.vue';
import UserAvatar from '@/components/UserAvatar.vue';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const customerStore = useCustomerStore();
const projectStore = useProjectStore();
const authStore = useAuthStore();

const customer = ref<any>(null);
const projects = ref<any[]>([]);
const showEdit = ref(false);
const showAddNote = ref(false);
const newNote = ref('');
const saving = ref(false);
const adding = ref(false);
const showEmailComposer = ref(false);
const showUserDetailModal = ref(false);
const selectedUser = ref(null);

const editForm = ref({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  referralSource: '',
  notes: ''
});

const fullName = computed(() => {
  if (!customer.value) return '';
  return `${customer.value.firstName} ${customer.value.lastName}`;
});

const activeProjects = computed(() => {
  return projects.value.filter(p => !['completed', 'cancelled'].includes(p.status));
});

const totalRevenue = computed(() => {
  return projects.value.reduce((sum, p) => sum + (p.contractAmount || 0), 0);
});

const totalPaid = computed(() => {
  return projects.value.reduce((sum, p) => {
    return sum + (p.payments?.reduce((pSum: number, pay: any) => pSum + (pay.amount || 0), 0) || 0);
  }, 0);
});

const balance = computed(() => totalRevenue.value - totalPaid.value);

// Current or most recent project (for activity sync)
const currentProject = computed(() => {
  if (projects.value.length === 0) return null;
  // Sort by updatedAt descending
  const sorted = [...projects.value].sort((a, b) => 
    new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  );
  return sorted[0];
});

// Activities from current project (customer-level view)
const customerActivities = computed(() => {
  if (!currentProject.value?.activities) return [];
  // Sort by timestamp descending
  return [...currentProject.value.activities].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
});

const projectColumns = [
  { name: 'projectNumber', label: 'Project #', field: 'projectNumber', align: 'left', sortable: true },
  { name: 'title', label: 'Title', field: 'title', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'amount', label: 'Contract', field: 'contractAmount', align: 'right', sortable: true },
  { name: 'balance', label: 'Balance', field: (row: any) => getProjectBalance(row), align: 'right' },
  { name: 'createdAt', label: 'Created', field: 'createdAt', align: 'center', sortable: true, 
    format: (val: string) => new Date(val).toLocaleDateString() },
];

function getProjectPaid(project: any) {
  return project.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
}

function getProjectBalance(project: any) {
  return (project.contractAmount || 0) - getProjectPaid(project);
}

function getProjectProgress(project: any) {
  const amount = project.contractAmount || 0;
  if (amount === 0) return 0;
  return getProjectPaid(project) / amount;
}

function formatAddress(address: any) {
  if (!address) return '';
  const parts = [address.street, address.city, address.state, address.zip].filter(Boolean);
  return parts.join(', ');
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    lead: 'blue',
    appointment: 'blue',
    rehash: 'blue',
    multitouch: 'blue',
    contract_sent: 'blue',
    contract_signed: 'orange',
    initial_funding_cleared: 'orange',
    deal_scrub_in_progress: 'orange',
    change_order_needed: 'orange',
    deal_scrub_complete: 'orange',
    materials_ordered: 'purple',
    materials_released: 'purple',
    materials_received: 'purple',
    contacted_for_install: 'green',
    install_in_progress: 'green',
    install_hung: 'green',
    install_complete_service_needed: 'green',
    install_complete: 'green',
    funding_received: 'positive',
    cancelled: 'negative',
  };
  return colors[status] || 'grey';
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(timestamp: string) {
  return new Date(timestamp).toLocaleString();
}

function activityTitle(activity: any) {
  const titles: Record<string, string> = {
    note: 'Note Added',
    status_change: 'Status Changed',
    task_complete: 'Task Completed',
    payment: 'Payment Recorded',
    call: 'Call Logged',
    change_order: 'Change Order',
    email: 'Email Sent',
  };
  return titles[activity.type] || activity.type;
}

function activityColor(type: string) {
  const colors: Record<string, string> = {
    note: 'purple',
    status_change: 'green',
    task_complete: 'cyan',
    payment: 'green',
    call: 'amber',
    change_order: 'orange',
    email: 'amber',
  };
  return colors[type] || 'primary';
}

function activityIcon(type: string) {
  const icons: Record<string, string> = {
    note: 'note',
    status_change: 'update',
    task_complete: 'check_circle',
    payment: 'payment',
    call: 'phone',
    change_order: 'edit',
    email: 'email',
  };
  return icons[type] || 'circle';
}

const roleColor = (role) => {
  const colors = {
    admin: 'positive',
    manager: 'warning',
    sales: 'primary',
    bdc: 'secondary',
    design_consultant: 'accent',
    production: 'info',
    warehouse: 'dark',
    installer: 'negative',
    contractor: 'grey',
  };
  return colors[role] || 'grey';
};

const formatRole = (role) => {
  return role.replace(/_/g, ' ').toUpperCase();
};

const formatEmploymentType = (type) => {
  const types = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contractor: 'Contractor',
  };
  return types[type] || type;
};

const copyText = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    $q.notify({ type: 'positive', message: 'Copied to clipboard' });
  });
};

async function fetchCustomerData() {
  try {
    const customerId = route.params.id as string;
    
    // Fetch customer with populated projects
    const response = await fetch(`/api/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch customer');
    customer.value = await response.json();
    await customerStore.fetchAuditTrail(customerId);
    
    // Fetch all projects for this customer
    const projectsResponse = await fetch(`/api/projects?customerId=${customerId}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    
    if (projectsResponse.ok) {
      projects.value = await projectsResponse.json();
    }
    
    // Populate edit form
    const contact = customer.value.contacts?.[0] || {};
    editForm.value = {
      firstName: customer.value.firstName || '',
      lastName: customer.value.lastName || '',
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address?.street || '',
      city: contact.address?.city || '',
      state: contact.address?.state || '',
      zip: contact.address?.zip || '',
      referralSource: customer.value.referralSource || '',
      notes: customer.value.notes || ''
    };
    
    // Join socket room for current project if exists
    if (currentProject.value) {
      joinProjectRoom(currentProject.value._id);
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to load customer data' });
    console.error(error);
  }
}

async function saveCustomer() {
  saving.value = true;
  try {
    const updateData = {
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      referralSource: editForm.value.referralSource,
      notes: editForm.value.notes,
      contacts: [{
        type: 'primary',
        name: `${editForm.value.firstName} ${editForm.value.lastName}`,
        phone: editForm.value.phone,
        email: editForm.value.email,
        address: {
          street: editForm.value.address,
          city: editForm.value.city,
          state: editForm.value.state,
          zip: editForm.value.zip
        }
      }]
    };
    
    const response = await fetch(`/api/customers/${customer.value._id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}` 
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) throw new Error('Failed to update customer');
    
    // Update local state
    const updated = await response.json();
    customer.value = updated;
    
    // CRITICAL: Update customer data in all projects
    await syncCustomerToProjects(updated);
    
    $q.notify({ type: 'positive', message: 'Customer updated successfully' });
    showEdit.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to update customer' });
    console.error(error);
  } finally {
    saving.value = false;
  }
}

// Sync customer changes to all projects
async function syncCustomerToProjects(updatedCustomer: any) {
  // Update the customerId reference in each project
  for (const project of projects.value) {
    // The project.customerId should now be the updated customer object
    project.customerId = updatedCustomer;
  }
  
  // Emit event for real-time sync across sessions
  if (socket.connected) {
    projects.value.forEach(project => {
      socket.emit('customer:updated', { 
        projectId: project._id, 
        customer: updatedCustomer 
      });
    });
  }
}

async function addNote() {
  if (!newNote.value.trim() || !currentProject.value) return;
  
  adding.value = true;
  try {
    const response = await fetch(`/api/projects/${currentProject.value._id}/activities`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}` 
      },
      body: JSON.stringify({
        type: 'note',
        content: newNote.value.trim(),
        metadata: { source: 'customer_detail_page' }
      })
    });
    
    if (!response.ok) throw new Error('Failed to add note');
    
    const activity = await response.json();
    
    // Add to local activity feed
    if (!currentProject.value.activities) {
      currentProject.value.activities = [];
    }
    currentProject.value.activities.push(activity);
    
    $q.notify({ type: 'positive', message: 'Note added to project' });
    newNote.value = '';
    showAddNote.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to add note' });
    console.error(error);
  } finally {
    adding.value = false;
  }
}

const showUserDetail = (user) => {
  selectedUser.value = user;
  showUserDetailModal.value = true;
};

function createProject() {
  router.push({
    path: '/projects',
    query: { newCustomer: customer.value._id }
  });
}

const refreshAuditTrail = async () => {
  try {
    await customerStore.fetchAuditTrail(route.params.id as string);
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to refresh audit trail' });
  }
};



// Socket handlers for real-time updates
const handleActivityUpdate = (activity: any) => {
  if (currentProject.value && currentProject.value._id === activity.projectId) {
    const exists = currentProject.value.activities?.some((a: any) => a._id === activity._id);
    if (!exists && currentProject.value.activities) {
      currentProject.value.activities.push(activity);
      $q.notify({ type: 'info', message: 'New activity on current project', position: 'top-right' });
    }
  }
};

const handleCustomerUpdate = (payload: { projectId: string; customer: any }) => {
  // Update customer in any project that references them
  projects.value.forEach(project => {
    if (project.customerId?._id === payload.customer._id) {
      project.customerId = payload.customer;
    }
  });
  
  // Update current customer view if it's the same customer
  if (customer.value?._id === payload.customer._id) {
    customer.value = { ...customer.value, ...payload.customer };
  }
};

onMounted(() => {
  connectSocket(authStore.token || undefined);
  fetchCustomerData();
  
  // Set up socket listeners
  socket.on('project:activity', handleActivityUpdate);
  socket.on('customer:updated', handleCustomerUpdate);
});

watch(() => route.params.id, fetchCustomerData);
</script>

<style scoped>
.page-container {
  padding: 20px;
}
</style>
