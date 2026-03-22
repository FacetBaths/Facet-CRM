<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
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
</style>
