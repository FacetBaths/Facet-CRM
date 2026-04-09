<template>
  <q-page class="page-container">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold">User Management</div>
      <q-btn 
        color="primary" 
        icon="person_add" 
        label="Add User" 
        @click="openAddUser"
        v-if="authStore.hasRole('admin')"
      />
    </div>

    <!-- Filters -->
    <div class="row q-gutter-sm q-mb-md" v-if="authStore.hasRole('admin')">
      <q-select
        v-model="filters.status"
        :options="statusOptions"
        label="Status"
        outlined
        dense
        clearable
        style="width: 150px"
        emit-value
        map-options
      />
      <q-select
        v-model="filters.role"
        :options="roleOptions"
        label="Role"
        outlined
        dense
        clearable
        style="width: 150px"
        emit-value
        map-options
      />
      <q-input
        v-model="filters.search"
        label="Search"
        outlined
        dense
        clearable
        style="width: 250px"
      >
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Users List -->
    <div class="glass-card">
      <q-table
        :rows="filteredUsers"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        flat
        dense
        :pagination="{ rowsPerPage: 20 }"
      >
        <template v-slot:body-cell-avatar="{ row }">
          <q-td>
            <q-avatar color="primary" text-color="white" size="32px">
              <q-img v-if="row.avatar" :src="row.avatar" />
              <span v-else>{{ getInitials(row.firstName, row.lastName) }}</span>
            </q-avatar>
          </q-td>
        </template>

        <template v-slot:body-cell-name="{ row }">
          <q-td>
            <div class="text-weight-medium">{{ row.firstName }} {{ row.lastName }}</div>
            <div class="text-caption text-grey-7">{{ row.email }}</div>
            <div v-if="row.employeeId" class="text-caption text-primary">ID: {{ row.employeeId }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-employeeId="{ row }">
          <q-td>
            {{ row.employeeId || '-' }}
          </q-td>
        </template>

        <template v-slot:body-cell-roles="{ row }">
          <q-td>
            <div class="row q-gutter-xs">
              <q-badge 
                v-for="role in row.roles" 
                :key="role"
                :color="roleColor(role)"
              >
                {{ formatRole(role) }}
              </q-badge>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-department="{ row }">
          <q-td>
            {{ row.department || '-' }}
          </q-td>
        </template>

        <template v-slot:body-cell-contact="{ row }">
          <q-td>
            <div v-if="row.phone">{{ row.phone }}</div>
            <div v-if="row.phoneExtension" class="text-caption text-grey-7">Ext: {{ row.phoneExtension }}</div>
            <div v-if="!row.phone && !row.phoneExtension" class="text-grey-7">-</div>
          </q-td>
        </template>

        <template v-slot:body-cell-employment="{ row }">
          <q-td>
            <div>{{ formatEmploymentType(row.employmentType) }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-status="{ row }">
          <q-td>
            <q-badge :color="statusColor(row.status)">
              {{ formatStatus(row.status) }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="{ row }">
          <q-td class="text-right">
            <q-btn flat round icon="visibility" size="sm" @click="viewUser(row)" />
            <q-btn flat round icon="edit" size="sm" @click="editUser(row)" />
            <q-btn 
              v-if="authStore.hasRole('admin') && row._id !== authStore.user?._id"
              flat 
              round 
              icon="delete" 
              size="sm" 
              color="negative"
              @click="confirmDelete(row)"
            />
          </q-td>
        </template>

        <template v-slot:no-data>
          <div class="text-center q-pa-lg">
            <q-icon name="people" size="48px" class="q-mb-sm" color="grey" />
            <div class="text-grey">No users found</div>
          </div>
        </template>
      </q-table>
    </div>

    <!-- Add/Edit User Dialog (Admin only) -->
    <q-dialog v-model="showUserDialog" persistent maximized
    >
      <q-card class="glass-card">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ isEditing ? 'Edit User' : 'Add New User' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        
        <q-card-section class="q-gutter-y-lg scroll" style="max-height: calc(100vh - 150px)"
        >
          <!-- Profile Section -->
          <div>
            <div class="text-subtitle1 text-weight-bold q-mb-md">Profile Information</div>
            
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input v-model="userForm.firstName" label="First Name *" outlined required />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="userForm.lastName" label="Last Name *" outlined required />
              </div>
            </div>
            
            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-12 col-sm-6">
                <q-input 
                  v-model="userForm.email" 
                  label="Email *" 
                  type="email" 
                  outlined 
                  required 
                  :disable="isEditing"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="userForm.phone" label="Phone" outlined />
              </div>
            </div>
            
            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-12 col-sm-6">
                <q-input v-model="userForm.phoneExtension" label="Extension" outlined />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="userForm.avatar" label="Avatar URL" outlined hint="Leave blank for initials" />
              </div>
            </div>
            
            <q-input 
              v-model="userForm.bio" 
              label="Bio" 
              type="textarea" 
              outlined 
              class="q-mt-md"
              hint="Brief description or notes about this user"
            />
          </div>

          <q-separator />

          <!-- Employment Section -->
          <div>
            <div class="text-subtitle1 text-weight-bold q-mb-md">Employment Information</div>
            
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input v-model="userForm.employeeId" label="Employee ID" outlined readonly>
                  <template v-slot:append>
                    <q-btn 
                      v-if="!userForm.employeeId && isEditing" 
                      flat 
                      dense 
                      color="primary" 
                      icon="auto_fix_high" 
                      label="Generate"
                      @click="generateEmployeeId"
                      :loading="generatingId"
                    />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="userForm.employmentType"
                  :options="employmentTypeOptions"
                  label="Employment Type *"
                  outlined
                  emit-value
                  map-options
                />
              </div>
            </div>
            
            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-12 col-sm-6">
                <q-input v-model="userForm.department" label="Department" outlined />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="userForm.status"
                  :options="statusOptions"
                  label="Status *"
                  outlined
                  emit-value
                  map-options
                />
              </div>
            </div>
            
            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-12 col-sm-6">
                <q-input v-model="userForm.hireDate" label="Hire Date" type="date" outlined />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="userForm.marketId"
                  :options="markets"
                  option-value="_id"
                  option-label="name"
                  label="Primary Market"
                  outlined
                  clearable
                  emit-value
                  map-options
                  hint="User's assigned market"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="userForm.markets"
                  :options="markets"
                  option-value="_id"
                  option-label="name"
                  label="Accessible Markets"
                  outlined
                  multiple
                  use-chips
                  emit-value
                  map-options
                  hint="Markets user can access/switch to"
                />
              </div>
            </div>
          </div>

          <q-separator />

          <!-- Roles Section -->
          <div>
            <div class="text-subtitle1 text-weight-bold q-mb-md">Roles & Permissions</div>
            
            <div class="text-caption text-grey-7 q-mb-sm">Select one or more roles:</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="role in roleOptions"
                :key="role.value"
                :color="userForm.roles?.includes(role.value) ? 'primary' : 'grey-4'"
                :text-color="userForm.roles?.includes(role.value) ? 'white' : 'black'"
                clickable
                @click="toggleRole(role.value)"
              >
                {{ role.label }}
              </q-chip>
            </div>
          </div>

          <q-separator v-if="!isEditing" />

          <!-- Password Section (only for new users) -->
          <div v-if="!isEditing">
            <div class="text-subtitle1 text-weight-bold q-mb-md">Password</div>
            
            <q-input 
              v-model="userForm.password" 
              label="Password *" 
              type="password" 
              outlined 
              required
              hint="Minimum 6 characters"
            />
          </div>
        </q-card-section>
        
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" :label="isEditing ? 'Save Changes' : 'Create User'" @click="saveUser" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- View User Dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card class="glass-card" style="min-width: 400px">
        <q-card-section v-if="selectedUser" class="text-center q-pa-lg">
          <q-avatar size="100px" color="primary" text-color="white" class="q-mb-md">
            <q-img v-if="selectedUser.avatar" :src="selectedUser.avatar" />
            <span v-else class="text-h3">{{ getInitials(selectedUser.firstName, selectedUser.lastName) }}</span>
          </q-avatar>
          
          <div class="text-h5 text-weight-bold">{{ selectedUser.firstName }} {{ selectedUser.lastName }}</div>
          <div class="text-subtitle1 text-grey-7 q-mb-sm">{{ selectedUser.email }}</div>
          
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
          
          <q-separator class="q-my-md" />
          
          <q-list dense>
            <q-item v-if="selectedUser.employeeId">
              <q-item-section>Employee ID:</q-item-section>
              <q-item-section side>{{ selectedUser.employeeId }}</q-item-section>
            </q-item>
            <q-item v-if="selectedUser.phone">
              <q-item-section>Phone:</q-item-section>
              <q-item-section side>{{ selectedUser.phone }}</q-item-section>
            </q-item>
            <q-item v-if="selectedUser.phoneExtension">
              <q-item-section>Extension:</q-item-section>
              <q-item-section side>{{ selectedUser.phoneExtension }}</q-item-section>
            </q-item>
            <q-item v-if="selectedUser.department">
              <q-item-section>Department:</q-item-section>
              <q-item-section side>{{ selectedUser.department }}</q-item-section>
            </q-item>
            <q-item v-if="selectedUser.employmentType">
              <q-item-section>Employment:</q-item-section>
              <q-item-section side>{{ formatEmploymentType(selectedUser.employmentType) }}</q-item-section>
            </q-item>
            <q-item v-if="selectedUser.status">
              <q-item-section>Status:</q-item-section>
              <q-item-section side>
                <q-badge :color="statusColor(selectedUser.status)">
                  {{ formatStatus(selectedUser.status) }}
                </q-badge>
              </q-item-section>
            </q-item>
            <q-item v-if="selectedUser.hireDate">
              <q-item-section>Hire Date:</q-item-section>
              <q-item-section side>{{ formatDate(selectedUser.hireDate) }}</q-item-section>
            </q-item>
          </q-list>
          
          <div v-if="selectedUser.bio" class="q-mt-md">
            <q-separator class="q-mb-md" />
            <div class="text-caption text-grey-7">Bio:</div>
            <div class="text-body2 q-mt-sm">{{ selectedUser.bio }}</div>
          </div>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card class="glass-card">
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">Change status for {{ userToDelete?.firstName }} {{ userToDelete?.lastName }}?</span>
        </q-card-section>
        
        <q-card-section>
          This will change the user's status to inactive. They will no longer be able to log in.
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Deactivate" @click="deleteUser" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/stores/users';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/boot/axios';
import type { UserRole } from '@/stores/auth';
import { useQuasar } from 'quasar';
import { date } from 'quasar';

const $q = useQuasar();
const userStore = useUserStore();
const authStore = useAuthStore();

const loading = ref(false);
const saving = ref(false);
const generatingId = ref(false);
const users = ref([]);
const markets = ref([]);

// Dialog states
const showUserDialog = ref(false);
const showViewDialog = ref(false);
const showDeleteConfirm = ref(false);
const isEditing = ref(false);

// Filters
const filters = ref({
  status: '',
  role: '',
  search: '',
});

// Form data
const userForm = ref({
  _id: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  phoneExtension: '',
  avatar: '',
  bio: '',
  employeeId: '',
  employmentType: 'full_time',
  department: '',
  status: 'active',
  hireDate: '',
  marketId: '',
  markets: [] as string[],
  roles: [] as UserRole[],
});

const selectedUser = ref(null);
const userToDelete = ref(null);

const columns = [
  { name: 'avatar', label: '', field: 'avatar', align: 'center', style: 'width: 50px' },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'employeeId', label: 'Employee ID', field: 'employeeId', align: 'left', sortable: true },
  { name: 'roles', label: 'Roles', field: 'roles', align: 'left', sortable: true },
  { name: 'department', label: 'Department', field: 'department', align: 'left', sortable: true },
  { name: 'contact', label: 'Contact', field: 'contact', align: 'left' },
  { name: 'employment', label: 'Employment', field: 'employment', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' },
];

const roleOptions = [
  { label: 'Admin', value: 'admin' as UserRole },
  { label: 'BDC', value: 'bdc' as UserRole },
  { label: 'Sales', value: 'sales' as UserRole },
  { label: 'Warehouse', value: 'warehouse' as UserRole },
  { label: 'Production', value: 'production' as UserRole },
  { label: 'Contractor', value: 'contractor' as UserRole },
  { label: 'Manager', value: 'manager' as UserRole },
  { label: 'Installer', value: 'installer' as UserRole },
];

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Terminated', value: 'terminated' },
];

const employmentTypeOptions = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contractor', value: 'contractor' },
  { label: 'Intern', value: 'intern' },
];

const formatRole = (role: UserRole) => {
  const roles: Record<UserRole, string> = {
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

const roleColor = (role: UserRole) => {
  const colors: Record<UserRole, string> = {
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

const formatStatus = (status: string) => {
  const statuses: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    terminated: 'Terminated',
  };
  return statuses[status] || status;
};

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'positive',
    inactive: 'grey',
    suspended: 'warning',
    terminated: 'negative',
  };
  return colors[status] || 'grey';
};

const formatEmploymentType = (type: string) => {
  const types: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contractor: 'Contractor',
    intern: 'Intern',
  };
  return types[type] || type;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return date.formatDate(dateStr, 'MMM DD, YYYY');
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const filteredUsers = computed(() => {
  let result = users.value;
  
  if (filters.value.status) {
    result = result.filter(u => u.status === filters.value.status);
  }
  
  if (filters.value.role) {
    result = result.filter(u => u.roles?.includes(filters.value.role));
  }
  
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(u => 
      u.firstName?.toLowerCase().includes(search) ||
      u.lastName?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.employeeId?.toLowerCase().includes(search)
    );
  }
  
  return result;
});

const resetForm = () => {
  userForm.value = {
    _id: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    phoneExtension: '',
    avatar: '',
    bio: '',
    employeeId: '',
    employmentType: 'full_time',
    department: '',
    status: 'active',
    hireDate: '',
    marketId: '',
    markets: [],
    roles: [],
  };
};

const openAddUser = () => {
  isEditing.value = false;
  resetForm();
  userForm.value.roles = ['contractor'];
  showUserDialog.value = true;
};

const editUser = (user: any) => {
  isEditing.value = true;
  userForm.value = { 
    ...user,
    // Ensure all fields are populated
    phone: user.phone || '',
    phoneExtension: user.phoneExtension || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    employeeId: user.employeeId || '',
    department: user.department || '',
    marketId: user.marketId || '',
    markets: user.markets || [],
    hireDate: user.hireDate ? user.hireDate.split('T')[0] : '',
  };
  showUserDialog.value = true;
};

const viewUser = (user: any) => {
  selectedUser.value = user;
  showViewDialog.value = true;
};

const toggleRole = (role: UserRole) => {
  const index = userForm.value.roles.indexOf(role);
  if (index > -1) {
    userForm.value.roles = userForm.value.roles.filter((r: UserRole) => r !== role);
  } else {
    userForm.value.roles = [...userForm.value.roles, role];
  }
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    await userStore.fetchUsers();
    // userStore.users is already a computed with fullName added
    users.value = userStore.users || [];
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to load users' });
  } finally {
    loading.value = false;
  }
};

const fetchMarkets = async () => {
  try {
    const { data } = await api.get('/company/markets');
    markets.value = data;
  } catch (error) {
    console.error('Failed to load markets:', error);
  }
};

const saveUser = async () => {
  // Validation
  if (!userForm.value.firstName || !userForm.value.lastName) {
    $q.notify({ type: 'warning', message: 'First and last name are required' });
    return;
  }

  if (!isEditing.value && !userForm.value.email) {
    $q.notify({ type: 'warning', message: 'Email is required' });
    return;
  }

  if (!isEditing.value && userForm.value.password.length < 6) {
    $q.notify({ type: 'warning', message: 'Password must be at least 6 characters' });
    return;
  }

  if (userForm.value.roles.length === 0) {
    $q.notify({ type: 'warning', message: 'Please select at least one role' });
    return;
  }

  saving.value = true;
  try {
    const payload: any = {
      firstName: userForm.value.firstName,
      lastName: userForm.value.lastName,
      phone: userForm.value.phone,
      phoneExtension: userForm.value.phoneExtension,
      avatar: userForm.value.avatar,
      bio: userForm.value.bio,
      employeeId: userForm.value.employeeId,
      employmentType: userForm.value.employmentType,
      department: userForm.value.department,
      status: userForm.value.status,
      hireDate: userForm.value.hireDate,
      marketId: userForm.value.marketId,
      markets: userForm.value.markets,
      roles: userForm.value.roles,
    };

    if (isEditing.value) {
      await userStore.updateUser(userForm.value._id, payload);
      $q.notify({ type: 'positive', message: 'User updated successfully' });
    } else {
      payload.email = userForm.value.email;
      payload.password = userForm.value.password;
      await userStore.createUser(payload);
      $q.notify({ type: 'positive', message: 'User created successfully' });
    }
    
    showUserDialog.value = false;
    await fetchUsers();
  } catch (error: any) {
    console.error('Save user error:', error);
    $q.notify({ 
      type: 'negative', 
      message: error.response?.data?.error || error.response?.data?.details || 'Failed to save user'
    });
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (user: any) => {
  userToDelete.value = user;
  showDeleteConfirm.value = true;
};

const deleteUser = async () => {
  if (!userToDelete.value) return;
  
  saving.value = true;
  try {
    await userStore.deleteUser(userToDelete.value._id);
    $q.notify({ type: 'positive', message: 'User deactivated' });
    showDeleteConfirm.value = false;
    await fetchUsers();
  } catch (error: any) {
    $q.notify({ type: 'negative', message: error.response?.data?.error || 'Failed to deactivate user' });
  } finally {
    saving.value = false;
  }
};

// Generate Employee ID
const generateEmployeeId = async () => {
  if (!userForm.value._id || userForm.value.roles.length === 0) {
    $q.notify({ type: 'warning', message: 'User must have at least one role' });
    return;
  }
  
  generatingId.value = true;
  try {
    // Get user's market and primary role
    const primaryRole = userForm.value.roles[0];
    const marketId = userForm.value.marketId || '';
    
    // Call API to preview (which will reserve the next sequence)
    const { data } = await api.post('/company/preview-employee-id', {
      marketId,
      role: primaryRole,
    });
    
    if (data.employeeId) {
      userForm.value.employeeId = data.employeeId;
      $q.notify({ 
        type: 'positive', 
        message: `Employee ID generated: ${data.employeeId}` 
      });
    }
  } catch (error: any) {
    $q.notify({ 
      type: 'negative', 
      message: error.response?.data?.error || 'Failed to generate Employee ID' 
    });
  } finally {
    generatingId.value = false;
  }
};

onMounted(() => {
  fetchUsers();
  fetchMarkets();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}
</style>
