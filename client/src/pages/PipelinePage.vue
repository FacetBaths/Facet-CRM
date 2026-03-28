<template>
  <q-page class="page-container">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Pipeline</div>
        <div class="text-caption text-grey-7">Click a group to expand stages • Drag to move</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn flat icon="list" label="List View" to="/projects" />
        <q-btn color="primary" icon="add" label="New Project" @click="$router.push('/projects?new=true')" />
      </div>
    </div>

    <!-- Pipeline Board -->
    <div class="pipeline-board">
      <div
        v-for="column in visibleColumns"
        :key="column.key"
        class="pipeline-column"
        :class="{ 
          'is-group': column.isGroup,
          'is-sub-stage': !column.isGroup,
          'drag-over': dragOverColumn === column.key,
          [`bg-${column.color}`]: column.isGroup
        }"
        :style="column.isGroup ? {} : { flex: '0 0 240px' }"
        @dragover.prevent="dragOverColumn = column.key"
        @dragleave="dragOverColumn = null"
        @drop="handleDrop($event, column)"
      >
        <!-- Group Header (clickable to expand) -->
        <template v-if="column.isGroup">
          <div class="group-header" :class="`bg-${column.color}`" @click="toggleGroup(column.status)">
            <div class="row items-center justify-between">
              <div class="text-weight-bold text-white">{{ column.label }}</div>
              <div class="row items-center q-gutter-sm">
                <q-badge color="white" text-color="dark">{{ getGroupCount(column.status) }}</q-badge>
                <q-icon 
                  :name="expandedGroups.includes(column.status) ? 'expand_less' : 'expand_more'" 
                  color="white"
                />
              </div>
            </div>
            <div class="text-caption text-white opacity-80 q-mt-xs">
              ${{ formatCurrency(getGroupRevenue(column.status)) }} • {{ column.description }}
            </div>
          </div>
        </template>

        <!-- Sub-stage Header (when expanded) -->
        <template v-else>
          <div class="substage-header">
            <div class="text-weight-medium">{{ column.label }}</div>
            <q-badge color="grey-4" text-color="dark">{{ getProjectsByStatus(column.status).length }}</q-badge>
          </div>
        </template>

        <!-- Loading State -->
        <div v-if="projectStore.isLoading && column.isGroup" class="column-loading">
          <q-spinner size="30px" color="white" />
        </div>

        <!-- Column Cards -->
        <div v-else class="column-cards" :class="{ 'substage-cards': !column.isGroup }">
          <div v-if="getProjectsByStatus(column.status).length === 0" class="no-projects">
            <div class="text-caption opacity-60">No projects</div>
          </div>
          
          <div
            v-for="project in getProjectsByStatus(column.status)"
            :key="project._id"
            class="project-card"
            :class="{ 'in-group': column.isGroup }"
            draggable="true"
            @dragstart="handleDragStart($event, project)"
            @dragend="dragOverColumn = null"
            @click="$router.push(`/projects/${project._id}`)"
          >
            <!-- Show sub-stage badge when in group view -->
            <q-badge 
              v-if="column.isGroup" 
              :color="getSubStageColor(project.status)"
              class="q-mb-xs"
              dense
            >
              {{ formatStatus(project.status) }}
            </q-badge>

            <div class="text-weight-medium text-primary q-mb-xs">{{ project.projectNumber }}</div>
            <div class="text-body2 q-mb-sm">{{ project.title }}</div>
            
            <div class="row items-center q-gutter-xs q-mb-sm">
              <q-icon name="person" size="16px" />
              <span class="text-caption">{{ project.customerId?.firstName }} {{ project.customerId?.lastName }}</span>
            </div>

            <div class="row items-center justify-between">
              <span class="text-weight-bold text-secondary">${{ project.contractAmount?.toLocaleString() || 0 }}</span>
              <q-avatar size="24px" color="grey-4" text-color="dark" v-if="project.assignedSalesId">
                {{ getInitials(project.assignedSalesId) }}
              </q-avatar>
            </div>

            <!-- Task Indicators -->
            <div v-if="project.tasks?.length" class="row q-mt-sm q-gutter-xs">
              <q-chip
                size="xs"
                :color="getTaskStatusColor(project.tasks)"
                text-color="white"
                dense
              >
                {{ getCompletedTasks(project.tasks) }}/{{ project.tasks.length }} Tasks
              </q-chip>
            </div>

            <!-- Payment Progress -->
            <q-linear-progress
              v-if="project.payments?.length"
              :value="getPaymentProgress(project)"
              size="4px"
              color="positive"
              class="q-mt-sm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Stage Selection Dialog (when dropping on a group) -->
    <q-dialog v-model="showStageDialog" persistent>
      <q-card class="glass-card" style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Select Stage</div>
          <div class="text-body2 text-grey-7 q-mt-sm">
            {{ draggedProject?.title }} → {{ targetGroup?.label }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-list>
            <q-item
              v-for="stage in targetGroup?.subStages"
              :key="stage.value"
              clickable
              @click="selectStage(stage.value)"
              :class="{ 'bg-grey-3': draggedProject?.status === stage.value }"
            >
              <q-item-section>
                <q-item-label>{{ stage.label }}</q-item-label>
              </q-item-section>
              <q-item-section side v-if="draggedProject?.status === stage.value">
                <q-icon name="check" color="positive" />
              </q-item-section>
            </q-item>
          </q-list>

          <q-input
            v-model="assignmentData.note"
            label="Add Note (optional)"
            type="textarea"
            outlined
            class="q-mt-md"
            rows="2"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelMove" />
          <q-btn color="primary" label="Move" @click="confirmMove" :loading="moving" :disable="!selectedStage" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProjectStore } from '@/stores/projects';
import { useUserStore } from '@/stores/users';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const projectStore = useProjectStore();
const userStore = useUserStore();

// Expanded groups state
const expandedGroups = ref<string[]>([]);

// Drag state
const draggedProject = ref<any>(null);
const dragOverColumn = ref<string | null>(null);
const showStageDialog = ref(false);
const targetGroup = ref<any>(null);
const selectedStage = ref<string>('');
const moving = ref(false);

const assignmentData = ref({
  note: '',
});

// Group definitions with sub-stages (matching backend enum)
const pipelineGroups = [
  {
    status: 'prospect',
    label: 'Prospect',
    color: 'info',
    description: 'Lead → Appointment → Rehash',
    subStages: [
      { label: 'Lead', value: 'lead' },
      { label: 'Appointment', value: 'appointment' },
      { label: 'Rehash/Multitouch', value: 'rehash_multitouch' },
      { label: 'Contract Sent', value: 'contract_sent' },
    ],
  },
  {
    status: 'customer',
    label: 'Customer',
    color: 'warning',
    description: 'Contract → Funding → Scrub',
    subStages: [
      { label: 'Contract Signed', value: 'contract_signed' },
      { label: 'Initial Funding Cleared', value: 'funding_cleared' },
      { label: 'Deal Scrub - In Progress', value: 'deal_scrub_in_progress' },
      { label: 'Change Order Needed', value: 'change_order_needed' },
      { label: 'Deal Scrub - Complete', value: 'deal_scrub_complete' },
    ],
  },
  {
    status: 'production',
    label: 'Production',
    color: 'accent',
    description: 'Materials ordered → released',
    subStages: [
      { label: 'Materials Ordered', value: 'materials_ordered' },
      { label: 'Materials Released', value: 'materials_released' },
      { label: 'Materials Received', value: 'materials_received' },
    ],
  },
  {
    status: 'install',
    label: 'Install',
    color: 'secondary',
    description: 'Contacted → In progress → Complete',
    subStages: [
      { label: 'Contacted for Install', value: 'install_contacted' },
      { label: 'Install In Progress', value: 'install_in_progress' },
      { label: 'Install Hung', value: 'install_hung' },
      { label: 'Install Complete - Service Needed', value: 'install_complete_service_needed' },
      { label: 'Install Complete', value: 'install_complete' },
    ],
  },
  {
    status: 'completed',
    label: 'Completed',
    color: 'positive',
    description: 'Funding received',
    subStages: [
      { label: 'Funding Received', value: 'funding_received' },
      { label: 'Completed', value: 'completed' },
    ],
  },
];

// Mapping from stage to group
const stageToGroup: Record<string, string> = {};
pipelineGroups.forEach(group => {
  group.subStages.forEach(stage => {
    stageToGroup[stage.value] = group.status;
  });
});

// Compute visible columns based on expanded groups
const visibleColumns = computed(() => {
  const columns: any[] = [];
  
  pipelineGroups.forEach(group => {
    // Always add the group column
    columns.push({
      key: group.status,
      isGroup: true,
      ...group,
    });
    
    // Add sub-stage columns if expanded
    if (expandedGroups.value.includes(group.status)) {
      group.subStages.forEach(stage => {
        columns.push({
          key: stage.value,
          isGroup: false,
          status: stage.value,
          label: stage.label,
          color: group.color,
        });
      });
    }
  });
  
  return columns;
});

// Toggle group expansion
const toggleGroup = (groupStatus: string) => {
  const index = expandedGroups.value.indexOf(groupStatus);
  if (index > -1) {
    expandedGroups.value.splice(index, 1);
  } else {
    expandedGroups.value.push(groupStatus);
  }
};

// Get projects by status
const getProjectsByStatus = (status: string) => {
  return projectStore.projects.filter((p: any) => p.status === status);
};

// Get projects by group
const getProjectsByGroup = (groupStatus: string) => {
  const group = pipelineGroups.find(g => g.status === groupStatus);
  if (!group) return [];
  const stageValues = group.subStages.map(s => s.value);
  return projectStore.projects.filter((p: any) => stageValues.includes(p.status));
};

// Group counts and revenue
const getGroupCount = (groupStatus: string) => {
  return getProjectsByGroup(groupStatus).length;
};

const getGroupRevenue = (groupStatus: string) => {
  return getProjectsByGroup(groupStatus).reduce((sum: number, p: any) => sum + (p.contractAmount || 0), 0);
};

const formatCurrency = (val: number) => {
  return val.toLocaleString();
};

// Drag handlers
const handleDragStart = (event: DragEvent, project: any) => {
  draggedProject.value = project;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', project._id);
  }
};

const handleDrop = (event: DragEvent, column: any) => {
  event.preventDefault();
  
  if (!draggedProject.value) return;
  
  if (column.isGroup) {
    // Dropped on a group - show stage selection
    if (draggedProject.value.status !== column.subStages[0].value) {
      targetGroup.value = column;
      selectedStage.value = ''; // Will be set by user
      showStageDialog.value = true;
    }
  } else {
    // Dropped on a sub-stage - direct move
    if (draggedProject.value.status !== column.status) {
      selectedStage.value = column.status;
      targetGroup.value = pipelineGroups.find(g => g.status === stageToGroup[column.status]);
      updateProjectStatus(column.status);
    }
  }
  
  dragOverColumn.value = null;
};

const selectStage = (stageValue: string) => {
  selectedStage.value = stageValue;
};

const updateProjectStatus = async (newStatus: string) => {
  if (!draggedProject.value) return;
  
  moving.value = true;
  try {
    await projectStore.updateProject(draggedProject.value._id, {
      status: newStatus,
    });
    
    // Add activity note if provided
    if (assignmentData.value.note) {
      await projectStore.addActivity(draggedProject.value._id, {
        type: 'note',
        content: `Moved to ${formatStatus(newStatus)}: ${assignmentData.value.note}`,
      });
    }
    
    // Trigger workflow automation
    await triggerWorkflowAutomation(draggedProject.value, newStatus);
    
    $q.notify({
      type: 'positive',
      message: `Moved to ${formatStatus(newStatus)}`,
    });
    
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to update status' });
  } finally {
    moving.value = false;
    draggedProject.value = null;
    assignmentData.value = { note: '' };
    showStageDialog.value = false;
    selectedStage.value = '';
  }
};

const confirmMove = () => {
  if (selectedStage.value) {
    updateProjectStatus(selectedStage.value);
  }
};

const cancelMove = () => {
  draggedProject.value = null;
  assignmentData.value = { note: '' };
  showStageDialog.value = false;
  selectedStage.value = '';
};

// Workflow automation
const triggerWorkflowAutomation = async (project: any, newStatus: string) => {
  // Auto-create tasks when reaching certain stages
  const taskTriggers: Record<string, string[]> = {
    'contract_signed': ['Schedule site measure', 'Order materials', 'Schedule install'],
    'materials_ordered': ['Track delivery date', 'Notify customer of ETA'],
    'install_contacted': ['Confirm install date with customer'],
  };
  
  if (taskTriggers[newStatus]) {
    for (const taskTitle of taskTriggers[newStatus]) {
      try {
        await projectStore.addTask(project._id, { title: taskTitle });
      } catch (e) {
        console.error('Failed to create task:', taskTitle);
      }
    }
    
    $q.notify({
      type: 'info',
      message: `Auto-created ${taskTriggers[newStatus].length} tasks`,
    });
  }
};

// Helpers
const getInitials = (user: any) => {
  if (!user) return '?';
  return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
};

const getCompletedTasks = (tasks: any[]) => {
  return tasks.filter((t: any) => t.status === 'completed').length;
};

const getTaskStatusColor = (tasks: any[]) => {
  const completed = getCompletedTasks(tasks);
  const total = tasks.length;
  if (completed === total) return 'positive';
  if (completed > 0) return 'warning';
  return 'grey';
};

const getPaymentProgress = (project: any) => {
  const totalPaid = project.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
  return project.contractAmount ? totalPaid / project.contractAmount : 0;
};

const formatStatus = (status: string) => {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace('Rehash Multitouch', 'Rehash/Multitouch')
    .replace('Deal Scrub In Progress', 'Deal Scrub - In Progress')
    .replace('Deal Scrub Complete', 'Deal Scrub - Complete');
};

const getSubStageColor = (status: string) => {
  const group = stageToGroup[status];
  const colorMap: Record<string, string> = {
    prospect: 'info',
    customer: 'warning',
    production: 'accent',
    install: 'secondary',
    completed: 'positive',
  };
  return colorMap[group] || 'grey';
};

onMounted(async () => {
  try {
    await Promise.all([
      projectStore.fetchProjects(),
      userStore.fetchUsers(),
    ]);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to load pipeline data',
    });
  }
});
</script>

<style scoped>
.pipeline-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 16px;
  min-height: calc(100vh - 200px);
  align-items: flex-start;
}

/* Group Column (collapsed or expanded group header) */
.pipeline-column.is-group {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  overflow: hidden;
}

/* Sub-stage Column (when expanded) */
.pipeline-column.is-sub-stage {
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.pipeline-column.drag-over {
  border-color: #9945FF;
  box-shadow: 0 0 0 2px rgba(153, 69, 255, 0.3);
}

/* Group Header */
.group-header {
  padding: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.group-header:hover {
  filter: brightness(1.1);
}

/* Sub-stage Header */
.substage-header {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Column Cards */
.column-cards {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  max-height: calc(100vh - 280px);
}

.substage-cards {
  max-height: calc(100vh - 240px);
}

.column-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.no-projects {
  text-align: center;
  padding: 24px;
  color: rgba(0, 0, 0, 0.5);
}

/* Project Cards */
.project-card {
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.project-card:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.project-card:active {
  cursor: grabbing;
}

/* Scrollbar styling */
.column-cards::-webkit-scrollbar {
  width: 6px;
}

.column-cards::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.column-cards::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.pipeline-board::-webkit-scrollbar {
  height: 8px;
}

.pipeline-board::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.pipeline-board::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}
</style>
