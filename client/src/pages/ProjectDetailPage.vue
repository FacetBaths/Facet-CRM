<template>
  <q-page class="page-container" v-if="project">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <q-btn flat icon="arrow_back" label="Back" @click="$router.push('/projects')" />
      <div class="text-h5 text-weight-bold">{{ project.projectNumber }}</div>
      <q-badge :color="statusColor(project.status)" class="q-px-md q-py-sm text-weight-bold">
        {{ formatStatus(project.status) }}
      </q-badge>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Left Column: Project Info -->
      <div class="col-12 col-md-4">
        <!-- Customer Card -->
        <div class="glass-card q-pa-md q-mb-md">
          <div class="text-h6 text-weight-bold q-mb-sm">{{ project.title }}</div>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-icon name="person" size="20px" />
            <a 
              href="#" 
              class="text-weight-medium text-primary"
              @click.prevent="$router.push(`/customers/${project.customerId?._id}`)"
            >
              {{ project.customerId?.firstName }} {{ project.customerId?.lastName }}
            </a>
          </div>
          
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-icon name="location_on" size="20px" />
            <span>{{ project.address?.street }}, {{ project.address?.city }}, {{ project.address?.state }}</span>
          </div>
          
          <div class="row items-center q-gutter-sm">
            <q-icon name="phone" size="20px" />
            <span>{{ project.customerId?.contacts?.[0]?.phone }}</span>
          </div>
        </div>

        <!-- Contract Info -->
        <div class="glass-card q-pa-md q-mb-md">
          <div class="text-subtitle2 text-grey-7 q-mb-sm">Contract</div>
          <div class="row justify-between items-center q-mb-sm">
            <span>Amount:</span>
            <span class="text-h6 text-weight-bold text-primary">${{ project.contractAmount?.toLocaleString() }}</span>
          </div>
          
          <div class="row justify-between items-center q-mb-sm">
            <span>Paid:</span>
            <span class="text-h6 text-weight-bold text-secondary">${{ totalPaid.toLocaleString() }}</span>
          </div>
          
          <div class="row justify-between items-center q-mb-md">
            <span>Balance:</span>
            <span class="text-h6 text-weight-bold">${{ balance.toLocaleString() }}</span>
          </div>

          <q-linear-progress
            :value="paymentProgress"
            size="12px"
            rounded
            color="secondary"
            track-color="grey-4"
            class="q-mb-sm"
          />
          
          <div class="text-caption text-center">{{ Math.round(paymentProgress * 100) }}% Paid</div>
        </div>

        <!-- Quick Actions -->
        <div class="glass-card q-pa-md">
          <div class="text-subtitle2 text-grey-7 q-mb-sm">Quick Actions</div>
          <div class="column q-gutter-sm">
            <q-btn color="primary" icon="note_add" label="Add Note" @click="showAddNote = true" unelevated />
            <q-btn color="secondary" icon="task" label="Add Task" @click="showAddTask = true" unelevated />
            <q-btn color="positive" icon="payment" label="Record Payment" @click="showAddPayment = true" unelevated />
            <q-btn color="warning" icon="edit" label="Change Order" @click="showChangeOrder = true" unelevated />
          </div>
        </div>

        <!-- Commission Card -->
        <div class="glass-card q-pa-md q-mt-md" v-if="project.commission?.calculatedAt">
          <div class="text-subtitle2 text-grey-7 q-mb-sm row items-center justify-between">
            <span>Commission</span>
            <q-btn flat round icon="refresh" size="sm" @click="calculateCommission" :loading="calculating" />
          </div>
          
          <!-- Sales Commission -->
          <div v-if="project.commission.salesRepId" class="q-mb-sm">
            <div class="row justify-between items-center">
              <div>
                <div class="text-caption text-grey-7">Sales Rep</div>
                <div class="text-body2">${{ project.commission.salesAmount?.toLocaleString() }}</div>
              </div>
              <q-btn
                v-if="!project.commission.salesPaid"
                label="Pay"
                color="positive"
                size="sm"
                @click="markCommissionPaid('sales')"
              />
              <q-badge v-else color="positive">Paid</q-badge>
            </div>
          </div>

          <!-- BDC Commission -->
          <div v-if="project.commission.bdcRepId" class="q-mb-sm">
            <div class="row justify-between items-center">
              <div>
                <div class="text-caption text-grey-7">BDC</div>
                <div class="text-body2">${{ project.commission.bdcAmount?.toLocaleString() }}</div>
              </div>
              <q-btn
                v-if="!project.commission.bdcPaid"
                label="Pay"
                color="positive"
                size="sm"
                @click="markCommissionPaid('bdc')"
              />
              <q-badge v-else color="positive">Paid</q-badge>
            </div>
          </div>

          <div class="text-caption text-grey-7 q-mt-sm">
            Calculated {{ formatDate(project.commission.calculatedAt) }}
          </div>
        </div>

        <div v-else class="glass-card q-pa-md q-mt-md">
          <q-btn color="primary" icon="calculate" label="Calculate Commission" @click="calculateCommission" :loading="calculating" class="full-width" />
        </div>
      </div>

      <!-- Right Column: Activity Feed -->
      <div class="col-12 col-md-8">
        <div class="glass-card">
          <!-- Activity Header -->
          <div class="q-pa-md border-bottom">
            <div class="row items-center justify-between">
              <div class="text-h6 text-weight-bold">Activity Feed</div>
              <q-btn flat round icon="refresh" @click="refreshActivities" :loading="loading" />
            </div>
          </div>

          <!-- Activity List -->
          <div class="activity-list q-pa-md">
            <div v-if="!activities.length" class="text-center text-grey q-pa-lg">
              <q-icon name="chat" size="48px" class="q-mb-sm" />
              <div>No activity yet</div>
            </div>

            <div v-for="activity in sortedActivities" :key="activity._id" class="activity-item q-pa-md q-mb-sm"
              :class="`activity-${activity.type}`">
              
              <div class="row items-start justify-between">
                <div class="row items-center q-gutter-sm">
                  <q-icon :name="activityIcon(activity.type)" :color="activityColor(activity.type)" size="24px" />
                  <div>
                    <div class="text-weight-medium">{{ activity.content }}</div>
                    <div class="text-caption text-grey-7">
                      {{ activity.userId?.firstName }} {{ activity.userId?.lastName }} • 
                      {{ formatDate(activity.timestamp) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tasks Section -->
        <div class="glass-card q-mt-md"
        >
          <div class="q-pa-md border-bottom">
            <div class="row items-center justify-between">
              <div class="text-h6 text-weight-bold">Tasks</div>
              <q-btn flat icon="add" label="New Task" @click="showAddTask = true" />
            </div>
          </div>

          <q-list separator>
            <q-item v-for="task in tasks" :key="task._id"
              :class="{ 'bg-green-1': task.status === 'completed' }"
            >
              <q-item-section avatar>
                <q-checkbox
                  :model-value="task.status === 'completed'"
                  @update:model-value="toggleTask(task._id, $event)"
                />
              </q-item-section>
              
              <q-item-section>
                <q-item-label :class="{ 'text-strike': task.status === 'completed' }">
                  {{ task.title }}
                </q-item-label>
                <q-item-label caption>
                  {{ task.assignedTo?.firstName || 'Unassigned' }} • 
                  {{ task.dueDate ? formatDate(task.dueDate) : 'No due date' }}
                </q-item-label>
              </q-item-section>
              
              <q-item-section side>
                <q-badge :color="taskStatusColor(task.status)">{{ task.status }}</q-badge>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="!tasks.length" class="text-center text-grey q-pa-lg">
            No tasks yet. Add one above.
          </div>
        </div>
      </div>
    </div>

    <!-- Add Note Dialog -->
    <q-dialog v-model="showAddNote" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Add Note</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="newNote" type="textarea" label="Note" outlined autogrow rows="3" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Add Note" @click="addNote" :loading="adding" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Task Dialog -->
    <q-dialog v-model="showAddTask" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Add Task</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="newTask.title" label="Task Title" outlined required />
          <q-input v-model="newTask.description" label="Description" type="textarea" outlined autogrow />
          
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-select
                v-model="newTask.assignedTo"
                :options="userStore.users"
                label="Assigned To"
                outlined
                option-value="_id"
                option-label="firstName"
                emit-value
              />
            </div>
            <div class="col-6">
              <q-input v-model="newTask.dueDate" label="Due Date" type="date" outlined />
            </div>
          </div>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Add Task" @click="addTask" :loading="adding" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Payment Dialog -->
    <q-dialog v-model="showAddPayment" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Record Payment</div>
        </q-card-section>
        
        <q-card-section class="q-gutter-md">
          <q-input v-model.number="newPayment.amount" label="Amount" type="number" prefix="$" outlined required />
          
          <q-select
            v-model="newPayment.type"
            :options="paymentTypeOptions"
            label="Payment Type"
            outlined
            emit-value
            map-options
            required
          />
          
          <q-select
            v-model="newPayment.method"
            :options="paymentMethodOptions"
            label="Payment Method"
            outlined
            emit-value
            map-options
            required
          />
          
          <q-input v-model="newPayment.notes" label="Notes" type="textarea" outlined autogrow />
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="positive" label="Record Payment" @click="addPayment" :loading="adding" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Change Order Dialog -->
    <q-dialog v-model="showChangeOrder" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Create Change Order</div>
        </q-card-section>
        
        <q-card-section class="q-gutter-md">
          <q-input v-model="newChangeOrder.description" label="Description" type="textarea" outlined autogrow required />
          <q-input v-model="newChangeOrder.reason" label="Reason" outlined required />
          <q-input v-model.number="newChangeOrder.amount" label="Amount" type="number" prefix="$" outlined required />
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="warning" label="Create Change Order" @click="createChangeOrder" :loading="adding" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>

  <!-- Loading State -->
  <q-page v-else-if="projectStore.isLoading" class="flex flex-center page-container">
    <q-spinner size="50px" color="primary" />
    <div class="text-caption q-mt-md">Loading project...</div>
  </q-page>

  <!-- Error State -->
  <q-page v-else-if="error" class="flex flex-center page-container">
    <div class="text-center">
      <q-icon name="error" size="50px" color="negative" />
      <div class="text-h6 q-mt-md">Failed to load project</div>
      <div class="text-caption text-grey-7 q-mb-md">{{ error }}</div>
      <q-btn color="primary" label="Try Again" @click="retryFetch" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from '@/stores/projects';
import { useUserStore } from '@/stores/users';
import { useAuthStore } from '@/stores/auth';
import { socket, connectSocket, joinProjectRoom, leaveProjectRoom } from '@/boot/socket';
import { api } from '@/boot/axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const route = useRoute();
const projectStore = useProjectStore();
const userStore = useUserStore();
const authStore = useAuthStore();

const loading = ref(false);
const adding = ref(false);
const error = ref<string | null>(null);

// Dialog states
const showAddNote = ref(false);
const showAddTask = ref(false);
const showAddPayment = ref(false);
const showChangeOrder = ref(false);

// Form data
const newNote = ref('');
const newTask = ref({ title: '', description: '', assignedTo: '', dueDate: '' });
const newPayment = ref({ amount: 0, type: '', method: '', notes: '' });
const newChangeOrder = ref({ description: '', reason: '', amount: 0 });

const project = computed(() => projectStore.currentProject);
const activities = computed(() => project.value?.activities || []);
const tasks = computed(() => project.value?.tasks || []);
const payments = computed(() => project.value?.payments || []);

const sortedActivities = computed(() => {
  return [...activities.value].sort((a: any, b: any) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
});

const totalPaid = computed(() => 
  payments.value?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0
);

const balance = computed(() => 
  (project.value?.contractAmount || 0) - totalPaid.value
);

const paymentProgress = computed(() => {
  if (!project.value?.contractAmount || project.value.contractAmount === 0) return 0;
  return Math.min(totalPaid.value / project.value.contractAmount, 1);
});

const paymentTypeOptions = [
  { label: 'Deposit', value: 'deposit' },
  { label: 'Milestone', value: 'milestone' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Final', value: 'final' },
];

const paymentMethodOptions = [
  { label: 'Cash', value: 'cash' },
  { label: 'Check', value: 'check' },
  { label: 'Card', value: 'card' },
  { label: 'Financing', value: 'financing' },
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

const taskStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'grey',
    in_progress: 'warning',
    completed: 'positive',
    cancelled: 'negative',
  };
  return colors[status] || 'grey';
};

const activityIcon = (type: string) => {
  const icons: Record<string, string> = {
    note: 'chat',
    status_change: 'sync',
    task_complete: 'task_alt',
    payment: 'payment',
    file_upload: 'attach_file',
    call: 'phone',
  };
  return icons[type] || 'circle';
};

const activityColor = (type: string) => {
  const colors: Record<string, string> = {
    note: 'primary',
    status_change: 'secondary',
    task_complete: 'info',
    payment: 'positive',
    file_upload: 'warning',
    call: 'accent',
  };
  return colors[type] || 'grey';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const refreshActivities = async () => {
  loading.value = true;
  error.value = null;
  try {
    await projectStore.fetchProject(route.params.id as string);
    if (!projectStore.currentProject) {
      error.value = 'Project not found';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load project';
  } finally {
    loading.value = false;
  }
};

const retryFetch = async () => {
  error.value = null;
  await refreshActivities();
};

const addNote = async () => {
  if (!newNote.value.trim()) return;
  
  adding.value = true;
  try {
    await projectStore.addActivity(route.params.id as string, {
      type: 'note',
      content: newNote.value,
    });
    $q.notify({ type: 'positive', message: 'Note added' });
    newNote.value = '';
    showAddNote.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to add note' });
  } finally {
    adding.value = false;
  }
};

const addTask = async () => {
  if (!newTask.value.title.trim()) return;
  
  adding.value = true;
  try {
    await projectStore.addTask(route.params.id as string, newTask.value);
    $q.notify({ type: 'positive', message: 'Task added' });
    newTask.value = { title: '', description: '', assignedTo: '', dueDate: '' };
    showAddTask.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to add task' });
  } finally {
    adding.value = false;
  }
};

const toggleTask = async (taskId: string, completed: boolean) => {
  try {
    await projectStore.updateTaskStatus(
      route.params.id as string,
      taskId,
      completed ? 'completed' : 'pending'
    );
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to update task' });
  }
};

const addPayment = async () => {
  if (!newPayment.value.amount || !newPayment.value.type || !newPayment.value.method) return;
  
  adding.value = true;
  try {
    await projectStore.addPayment(route.params.id as string, newPayment.value);
    $q.notify({ type: 'positive', message: 'Payment recorded' });
    newPayment.value = { amount: 0, type: '', method: '', notes: '' };
    showAddPayment.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to record payment' });
  } finally {
    adding.value = false;
  }
};

// Commission functions
const calculating = ref(false);

const calculateCommission = async () => {
  calculating.value = true;
  try {
    await api.post(`/projects/${route.params.id}/calculate-commission`);
    $q.notify({ type: 'positive', message: 'Commission calculated' });
    // Refresh project to get updated commission data
    await projectStore.fetchProject(route.params.id as string);
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to calculate commission' });
  } finally {
    calculating.value = false;
  }
};

const markCommissionPaid = async (type: 'sales' | 'bdc') => {
  try {
    await api.post(`/projects/${route.params.id}/commission/pay`, { type });
    $q.notify({ type: 'positive', message: 'Commission marked as paid' });
    await projectStore.fetchProject(route.params.id as string);
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to mark commission as paid' });
  }
};

const createChangeOrder = async () => {
  if (!newChangeOrder.value.description || !newChangeOrder.value.reason) return;
  
  adding.value = true;
  try {
    // Call API directly since we need the route param
    await projectStore.addActivity(route.params.id as string, {
      type: 'note',
      content: `Change Order: ${newChangeOrder.value.description} (${newChangeOrder.value.amount > 0 ? '+' : ''}$${newChangeOrder.value.amount})`,
    });
    $q.notify({ type: 'positive', message: 'Change order created' });
    newChangeOrder.value = { description: '', reason: '', amount: 0 };
    showChangeOrder.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to create change order' });
  } finally {
    adding.value = false;
  }
};

// Socket event handlers
const handleActivityUpdate = (activity: any) => {
  if (project.value?.activities) {
    // Check if activity already exists (avoid duplicates)
    const exists = project.value.activities.some((a: any) => a._id === activity._id);
    if (!exists) {
      project.value.activities.push(activity);
      // Show subtle notification for real-time updates
      $q.notify({
        type: 'info',
        message: 'New activity added',
        position: 'top-right',
        timeout: 2000,
        actions: [{ icon: 'close', color: 'white' }],
      });
    }
  }
};

const handleTaskUpdate = (payload: { action: string; task: any }) => {
  if (project.value?.tasks) {
    const index = project.value.tasks.findIndex((t: any) => t._id === payload.task._id);
    if (index > -1) {
      project.value.tasks[index] = payload.task;
    } else if (payload.action === 'created') {
      project.value.tasks.push(payload.task);
    }
  }
};

const handlePaymentUpdate = (payload: { amount: number; totalPaid: number; percentPaid: number }) => {
  if (project.value) {
    // Refresh project data to get accurate state
    projectStore.fetchProject(route.params.id as string);
  }
};

const handleChangeOrderUpdate = (payload: { action: string; changeOrder: any }) => {
  if (project.value?.changeOrders) {
    const index = project.value.changeOrders.findIndex((c: any) => c._id === payload.changeOrder._id);
    if (index > -1) {
      project.value.changeOrders[index] = payload.changeOrder;
    } else if (payload.action === 'created') {
      project.value.changeOrders.push(payload.changeOrder);
    }
  }
};

const handleCustomerUpdate = (payload: { projectId: string; customer: any }) => {
  // Update customer data in the current project
  if (project.value && project.value._id === payload.projectId) {
    project.value.customerId = payload.customer;
    $q.notify({
      type: 'info',
      message: 'Customer information updated',
      position: 'top-right',
      timeout: 2000
    });
  }
};

onMounted(async () => {
  const projectId = route.params.id as string;
  error.value = null;
  
  try {
    await Promise.all([
      projectStore.fetchProject(projectId),
      userStore.fetchUsers(),
    ]);
    
    if (!projectStore.currentProject) {
      error.value = 'Project not found';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load project';
  }
  
  // Connect socket and join project room
  connectSocket(authStore.token);
  joinProjectRoom(projectId);
  
  // Set up socket listeners for real-time updates
  socket.on('project:activity', handleActivityUpdate);
  socket.on('project:task', handleTaskUpdate);
  socket.on('project:payment', handlePaymentUpdate);
  socket.on('project:changeOrder', handleChangeOrderUpdate);
  socket.on('customer:updated', handleCustomerUpdate);
});

onUnmounted(() => {
  const projectId = route.params.id as string;
  
  // Clean up socket listeners
  socket.off('project:activity', handleActivityUpdate);
  socket.off('project:task', handleTaskUpdate);
  socket.off('project:payment', handlePaymentUpdate);
  socket.off('project:changeOrder', handleChangeOrderUpdate);
  socket.off('customer:updated', handleCustomerUpdate);
  
  leaveProjectRoom(projectId);
});

// Re-join room if project ID changes
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    if (oldId) leaveProjectRoom(oldId as string);
    if (newId) {
      joinProjectRoom(newId as string);
      projectStore.fetchProject(newId as string);
    }
  }
});
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.activity-list {
  max-height: 500px;
  overflow-y: auto;
}

.activity-item {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
}

.activity-note { border-left: 3px solid #9945FF; }
.activity-status_change { border-left: 3px solid #14F195; }
.activity-task_complete { border-left: 3px solid #31CCEC; }
.activity-payment { border-left: 3px solid #21BA45; }
.activity-call { border-left: 3px solid #F2C037; }

.text-strike {
  text-decoration: line-through;
  opacity: 0.7;
}
</style>
