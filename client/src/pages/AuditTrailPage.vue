<template>
  <q-page class="page-container">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold">Audit Trail</div>
      <q-btn flat icon="refresh" label="Refresh" @click="fetchAudits" :loading="isLoading" v-if="canViewAudits" />
    </div>

    <div v-if="canViewAudits">
      <!-- Filters -->
      <div class="glass-card q-pa-md q-mb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.entityType"
              :options="entityTypeOptions"
              label="Entity Type"
              outlined
              clearable
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.entityId"
              label="Entity ID"
              outlined
              clearable
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.dateFrom"
              label="Date From"
              type="date"
              outlined
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="filters.dateTo"
              label="Date To"
              type="date"
              outlined
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.userId"
              :options="userOptions"
              label="User"
              outlined
              clearable
              option-value="_id"
              option-label="name"
              :disable="!isAdmin"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.action"
              :options="actionOptions"
              label="Action Type"
              outlined
              clearable
            />
          </div>
        </div>
        <div class="row justify-end q-mt-md">
          <q-btn color="primary" label="Apply Filters" @click="fetchAudits" />
        </div>
      </div>

      <!-- Audit List -->
      <div class="glass-card">
        <q-list separator>
          <audit-trail-item
            v-for="audit in sortedAudits"
            :key="audit._id"
            :audit="audit"
          />
        </q-list>
        <div v-if="!audits.length && !isLoading" class="text-center q-pa-lg text-grey">
          No audit records found
        </div>
      </div>
    </div>

    <div v-else class="glass-card q-pa-md text-center">
      <q-icon name="lock" size="lg" color="negative" />
      <div class="text-h6 q-mt-md">Access Restricted</div>
      <div class="text-body2 text-grey-7 q-mt-sm">Audit trail viewing is available to administrators only.</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAuditStore } from '@/stores/auditStore';
import { useUserStore } from '@/stores/users';
import { useAuthStore } from '@/stores/auth';
import AuditTrailItem from '@/components/AuditTrailItem.vue';

const auditStore = useAuditStore();
const userStore = useUserStore();
const authStore = useAuthStore();

const audits = computed(() => auditStore.audits);
const isLoading = computed(() => auditStore.isLoading);
const filters = auditStore.filters;

const isAdmin = computed(() => authStore.hasRole('admin'));
const isManager = computed(() => authStore.hasRole('manager'));
const canViewAudits = computed(() => isAdmin.value || isManager.value);

const sortedAudits = computed(() => {
  return [...audits.value].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
});

const entityTypeOptions = [
  { label: 'Project', value: 'project' },
  { label: 'Customer', value: 'customer' },
];

const actionOptions = [
  'create', 'update', 'delete', 'status_change', 'payment', 'task_update' // Add based on actual actions
];

const userOptions = computed(() => {
  return userStore.users.map(user => ({
    _id: user._id,
    name: `${user.firstName} ${user.lastName}`
  }));
});

const fetchAudits = () => {
  if (canViewAudits.value) {
    auditStore.fetchAudits();
  }
};

onMounted(() => {
  userStore.fetchUsers(); // Assuming userStore has fetchUsers
  fetchAudits();
});
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
