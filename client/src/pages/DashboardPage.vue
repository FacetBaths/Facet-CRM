<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Pipeline Summary -->
      <div class="col-12">
        <div class="text-h6 q-mb-md">Pipeline Summary</div>
        <div class="row q-col-gutter-md">
          <div
            v-for="group in pipelineSummary"
            :key="group.status"
            class="col-12 col-sm-6 col-md-4 col-lg-2"
          >
            <q-card
              class="pipeline-summary-card cursor-pointer"
              :class="`bg-${group.color}`"
              flat
              @click="$router.push('/projects/pipeline')"
            >
              <q-card-section class="text-white">
                <div class="text-caption text-weight-medium opacity-80">{{ group.label }}</div>
                <div class="text-h4 text-weight-bold q-my-sm">{{ group.count }}</div>
                
                <div class="text-caption opacity-90">
                  ${{ formatCurrency(group.revenue) }} Revenue
                </div>
                
                <div class="text-caption opacity-70 q-mt-xs">{{ group.description }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="col-12 col-md-3">
        <q-card class="dashboard-card" flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-grey-6">Active Projects</div>
            <div class="text-h4 text-primary">{{ stats.activeProjects }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="dashboard-card" flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-grey-6">Pending Tasks</div>
            <div class="text-h4 text-warning">{{ stats.pendingTasks }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="dashboard-card" flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-grey-6">This Month Revenue</div>
            <div class="text-h4 text-secondary">${{ formatCurrency(stats.monthlyRevenue) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="dashboard-card" flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-grey-6">Active Subscriptions</div>
            <div class="text-h4 text-info">{{ stats.activeSubscriptions }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Recent Projects -->
      <div class="col-12 col-md-8">
        <q-card flat bordered>
          <q-card-section class="row items-center justify-between">
            <div class="text-h6">Recent Projects</div>
            <q-btn color="primary" label="View All" to="/projects" flat />
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-list v-if="projects.length">
              <q-item v-for="project in recentProjects" :key="project._id" clickable :to="`/projects/${project._id}`">
                <q-item-section>
                  <q-item-label>{{ project.title }}</q-item-label>
                  <q-item-label caption>
                    {{ project.customerId?.firstName }} {{ project.customerId?.lastName }} • {{ formatStatus(project.status) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="statusColor(project.status)">
                    {{ project.projectNumber }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center text-grey q-pa-lg">
              No recent projects
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Upcoming Renewals -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Upcoming Renewals</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-list>
              <q-item v-for="i in 3" :key="i">
                <q-item-section>
                  <q-item-label>Sample Customer</q-item-label>
                  <q-item-label caption>Edge Plan • Due in {{ i }} days</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn icon="payment" flat round color="primary" size="sm" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProjectStore } from '@/stores/projects';

const projectStore = useProjectStore();

const stats = ref({
  activeProjects: 0,
  pendingTasks: 0,
  monthlyRevenue: 0,
  activeSubscriptions: 0,
});

const projects = computed(() => projectStore.projects);

// Pipeline grouping (matches LEAP Stage Groups - updated with all detailed stages)
const statusToGroup: Record<string, string> = {
  // Prospect
  'lead': 'prospect',
  'appointment': 'prospect',
  'rehash_multitouch': 'prospect',
  'contract_sent': 'prospect',
  // Customer
  'contract_signed': 'customer',
  'funding_cleared': 'customer',
  'deal_scrub_in_progress': 'customer',
  'change_order_needed': 'customer',
  'deal_scrub_complete': 'customer',
  // Production
  'materials_ordered': 'production',
  'materials_released': 'production',
  'materials_received': 'production',
  // Install
  'install_contacted': 'install',
  'install_in_progress': 'install',
  'install_hung': 'install',
  'install_complete_service_needed': 'install',
  'install_complete': 'install',
  // Completed
  'funding_received': 'completed',
  'completed': 'completed',
  // Legacy mappings for compatibility
  'qualified': 'prospect',
  'design_scheduled': 'prospect',
  'production_scheduled': 'production',
  'in_production': 'install',
  'final_walkthrough': 'install',
};

const pipelineSummary = computed(() => {
  const groups = [
    { status: 'prospect', label: 'Prospect', color: 'info', description: 'Lead → Appointment → Rehash' },
    { status: 'customer', label: 'Customer', color: 'warning', description: 'Contract → Funding → Scrub' },
    { status: 'production', label: 'Production', color: 'accent', description: 'Materials ordered → released' },
    { status: 'install', label: 'Install', color: 'secondary', description: 'Contacted → In progress → Complete' },
    { status: 'completed', label: 'Completed', color: 'positive', description: 'Funding received' },
  ];

  return groups.map(group => {
    const groupProjects = projects.value.filter((p: any) => statusToGroup[p.status] === group.status);
    return {
      ...group,
      count: groupProjects.length,
      revenue: groupProjects.reduce((sum: number, p: any) => sum + (p.contractAmount || 0), 0),
    };
  });
});

const recentProjects = computed(() => {
  return projects.value.slice(0, 5);
});

const formatCurrency = (val: number) => {
  return val.toLocaleString();
};

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

onMounted(async () => {
  await projectStore.fetchProjects();
  // Load stats from API
  stats.value.activeProjects = projects.value.length;
});
</script>

<style scoped>
.dashboard-card {
  transition: transform 0.2s;
}
.dashboard-card:hover {
  transform: translateY(-2px);
}

.pipeline-summary-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.pipeline-summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
</style>
