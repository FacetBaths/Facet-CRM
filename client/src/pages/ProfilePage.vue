<template>
  <q-page class="page-container">
    <div class="text-h5 text-weight-bold q-mb-md">My Profile</div>
    
    <div class="row q-col-gutter-lg">
      <!-- Left Column: Profile Info -->
      <div class="col-12 col-md-4">
        <q-card class="glass-card q-pa-lg">
          <div class="text-center q-mb-lg">
            <q-avatar size="120px" color="primary" text-color="white" class="q-mb-md">
              <q-img v-if="authStore.user?.avatar" :src="authStore.user.avatar" />
              <span v-else class="text-h3">{{ authStore.initials }}</span>
            </q-avatar>
            
            <!-- Avatar URL Input -->
            <q-input 
              v-model="form.avatar" 
              label="Avatar URL" 
              outlined 
              dense
              class="q-mt-sm"
              hint="Enter URL to profile photo, or leave blank for initials"
            >
              <template v-slot:append>
                <q-btn flat round icon="refresh" size="sm" @click="clearAvatar" />
              </template>
            </q-input>
            <div class="text-h6 text-weight-bold">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</div>
            <div class="text-caption text-grey-7">{{ authStore.user?.email }}</div>
            <div class="q-mt-sm">
              <q-badge v-for="role in authStore.user?.roles" :key="role" :color="roleColor(role)" class="q-mr-xs">
                {{ formatRole(role) }}
              </q-badge>
            </div>
          </div>
          
          <q-separator class="q-mb-md" />
          
          <q-list dense>
            <q-item>
              <q-item-section>Employee ID:</q-item-section>
              <q-item-section side>{{ authStore.user?.employeeId || 'Not assigned' }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Department:</q-item-section>
              <q-item-section side>{{ authStore.user?.department || 'Not assigned' }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Employment Type:</q-item-section>
              <q-item-section side>{{ formatEmploymentType(authStore.user?.employmentType) }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Status:</q-item-section>
              <q-item-section side>
                <q-badge :color="statusColor(authStore.user?.status)">
                  {{ formatStatus(authStore.user?.status) }}
                </q-badge>
              </q-item-section>
            </q-item>
            <q-item v-if="authStore.user?.hireDate">
              <q-item-section>Hire Date:</q-item-section>
              <q-item-section side>{{ formatDate(authStore.user.hireDate) }}</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
      
      <!-- Right Column: Edit Form -->
      <div class="col-12 col-md-8">
        <q-card class="glass-card q-pa-lg">
          <div class="text-h6 q-mb-md">Edit Profile</div>
          
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.firstName" label="First Name" outlined required />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.lastName" label="Last Name" outlined required />
            </div>
          </div>
          
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.phone" label="Phone" outlined />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.phoneExtension" label="Extension" outlined />
            </div>
          </div>
          
          <q-input v-model="form.bio" label="Bio" type="textarea" outlined class="q-mb-md" />
          
          <q-separator class="q-my-lg" />
          
          <div class="text-h6 q-mb-md">Change Password</div>
          
          <q-input 
            v-model="passwordForm.currentPassword" 
            label="Current Password" 
            type="password" 
            outlined 
            class="q-mb-md"
          />
          
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input 
                v-model="passwordForm.newPassword" 
                label="New Password" 
                type="password" 
                outlined 
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input 
                v-model="passwordForm.confirmPassword" 
                label="Confirm New Password" 
                type="password" 
                outlined 
              />
            </div>
          </div>
          
          <div class="q-mt-lg">
            <q-btn color="primary" label="Save Changes" @click="saveProfile" :loading="saving" />
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const authStore = useAuthStore();

const saving = ref(false);

const form = ref({
  firstName: '',
  lastName: '',
  phone: '',
  phoneExtension: '',
  bio: '',
  avatar: '',
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const formatRole = (role: string) => {
  const roles: Record<string, string> = {
    admin: 'Admin',
    bdc: 'BDC',
    sales: 'Sales',
    warehouse: 'Warehouse',
    production: 'Production',
    contractor: 'Contractor',
    manager: 'Manager',
    installer: 'Installer',
  };
  return roles[role] || role;
};

const roleColor = (role: string) => {
  const colors: Record<string, string> = {
    admin: 'negative',
    bdc: 'accent',
    sales: 'primary',
    warehouse: 'orange',
    production: 'warning',
    contractor: 'info',
    manager: 'purple',
    installer: 'teal',
  };
  return colors[role] || 'grey';
};

const formatEmploymentType = (type?: string) => {
  const types: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contractor: 'Contractor',
    intern: 'Intern',
  };
  return types[type || ''] || type || 'Unknown';
};

const formatStatus = (status?: string) => {
  const statuses: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    terminated: 'Terminated',
  };
  return statuses[status || ''] || status || 'Unknown';
};

const statusColor = (status?: string) => {
  const colors: Record<string, string> = {
    active: 'positive',
    inactive: 'grey',
    suspended: 'warning',
    terminated: 'negative',
  };
  return colors[status || ''] || 'grey';
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const loadForm = () => {
  if (authStore.user) {
    form.value = {
      firstName: authStore.user.firstName || '',
      lastName: authStore.user.lastName || '',
      phone: authStore.user.phone || '',
      phoneExtension: authStore.user.phoneExtension || '',
      bio: authStore.user.bio || '',
      avatar: authStore.user.avatar || '',
    };
  }
};

const clearAvatar = () => {
  form.value.avatar = '';
};

const saveProfile = async () => {
  if (!form.value.firstName || !form.value.lastName) {
    $q.notify({ type: 'warning', message: 'First and last name are required' });
    return;
  }

  saving.value = true;
  try {
    const updateData: any = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      phone: form.value.phone,
      phoneExtension: form.value.phoneExtension,
      bio: form.value.bio,
      avatar: form.value.avatar,
    };

    // Handle password change
    if (passwordForm.value.newPassword) {
      if (passwordForm.value.newPassword.length < 6) {
        $q.notify({ type: 'warning', message: 'Password must be at least 6 characters' });
        saving.value = false;
        return;
      }
      if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        $q.notify({ type: 'warning', message: 'Passwords do not match' });
        saving.value = false;
        return;
      }
      if (!passwordForm.value.currentPassword) {
        $q.notify({ type: 'warning', message: 'Current password is required to change password' });
        saving.value = false;
        return;
      }
      updateData.password = passwordForm.value.newPassword;
      updateData.currentPassword = passwordForm.value.currentPassword;
    }

    await authStore.updateProfile(updateData);
    
    // Reset password form
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    
    $q.notify({ type: 'positive', message: 'Profile updated successfully' });
  } catch (error: any) {
    $q.notify({ type: 'negative', message: error.message || 'Failed to update profile' });
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadForm();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}
</style>
