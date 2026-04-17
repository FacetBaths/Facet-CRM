<template>
  <q-page class="q-pa-md gradient-bg">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Vendors</div>
      <q-btn color="primary" icon="add" label="New Vendor" @click="showNewVendorDialog = true" v-if="canManageVendors" />
    </div>

    <q-card flat bordered class="glass-card">
      <q-table
        :rows="vendorStore.vendors"
        :columns="columns"
        row-key="_id"
        :loading="vendorStore.isLoading"
        flat
        dense
      >
        <template v-slot:body-cell-contact="{ row }">
          <q-td>
            {{ row.contacts?.[0]?.phone || '' }}
          </q-td>
        </template>
        <template v-slot:body-cell-actions="{ row }">
          <q-td class="text-right">
            <q-btn flat round icon="edit" @click="editVendor(row)" v-if="canManageVendors" />
          </q-td>
        </template>
       </q-table>
    </q-card>

    <!-- New Vendor Dialog Placeholder -->
    <q-dialog v-model="showNewVendorDialog" persistent>
      <q-card style="width: 500px; max-width: 80vw;" class="glass-card">
        <q-card-section>
          <div class="text-h6">New Vendor</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="createVendor" class="q-gutter-md">
  <q-input v-model="newVendor.name" label="Name" outlined required />

  <q-select
    v-model="newVendor.type"
    :options="vendorTypes"
    label="Type"
    outlined
    required
  />

  <q-input v-model="newVendor.taxId" label="Tax ID" outlined />

  <q-input v-model="newVendor.paymentTerms" label="Payment Terms" outlined />

  <div class="text-subtitle2">Primary Contact</div>
  <q-input v-model="newVendor.contacts[0].name" label="Contact Name" outlined required />
  <q-input v-model="newVendor.contacts[0].phone" label="Phone" outlined required type="tel" />
  <q-input v-model="newVendor.contacts[0].email" label="Email" outlined type="email" />

  <q-input v-model="newVendor.notes" label="Notes" type="textarea" outlined />

  <div class="row justify-end q-gutter-sm">
    <q-btn label="Cancel" flat v-close-popup />
    <q-btn label="Create" type="submit" color="primary" :loading="creating" />
  </div>
</q-form>
        </q-card-section>
    </q-card>
    </q-dialog>

    <!-- Edit Vendor Dialog -->
    <q-dialog v-model="showEditVendorDialog" persistent>
      <q-card style="width: 500px; max-width: 80vw;" class="glass-card">
        <q-card-section>
          <div class="text-h6">Edit Vendor</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="updateVendor" class="q-gutter-md" v-if="selectedVendor">
            <q-input v-model="selectedVendor.name" label="Name" outlined required />

            <q-select
              v-model="selectedVendor.type"
              :options="vendorTypes"
              label="Type"
              outlined
              required
            />

            <q-input v-model="selectedVendor.taxId" label="Tax ID" outlined />

            <q-input v-model="selectedVendor.paymentTerms" label="Payment Terms" outlined />

            <div class="text-subtitle2">Primary Contact</div>
            <q-input v-model="selectedVendor.contacts[0].name" label="Contact Name" outlined required />
            <q-input v-model="selectedVendor.contacts[0].phone" label="Phone" outlined required type="tel" />
            <q-input v-model="selectedVendor.contacts[0].email" label="Email" outlined type="email" />

            <q-input v-model="selectedVendor.notes" label="Notes" type="textarea" outlined />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" flat v-close-popup />
              <q-btn label="Update" type="submit" color="primary" :loading="updating" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useVendorStore } from '@/stores/vendors';
import { useAuthStore } from '@/stores/auth';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const vendorStore = useVendorStore();
const authStore = useAuthStore();
const canManageVendors = computed(() => authStore.user?.roles?.some(r => ['admin', 'manager', 'production', 'warehouse'].includes(r)) ?? false);
const showNewVendorDialog = ref(false);
const showEditVendorDialog = ref(false);
const creating = ref(false);
const updating = ref(false);
const selectedVendor = ref<Vendor | null>(null);

const newVendor = reactive({
  name: '',
  type: '',
  taxId: '',
  paymentTerms: '',
  contacts: [{
    type: 'primary',
    name: '',
    phone: '',
    email: '',
  }],
  notes: '',
});

const vendorTypes = ['supplier', 'subcontractor', 'utility', 'other'];

const columns = [
  { name: 'name', label: 'Name', align: 'left', sortable: true },
  { name: 'type', label: 'Type', field: 'type', align: 'left', sortable: true },
  { name: 'contact', label: 'Contact', align: 'left' },
  { name: 'paymentTerms', label: 'Payment Terms', field: 'paymentTerms', align: 'left', sortable: true },
  { name: 'actions', label: ' ', align: 'right' },
];

const createVendor = async () => {
  creating.value = true;
  try {
    const vendor = await vendorStore.createVendor(newVendor);
    $q.notify({ type: 'positive', message: `Vendor ${vendor.name} created` });
    showNewVendorDialog.value = false;
    // Reset form
    newVendor.name = '';
    newVendor.type = '';
    newVendor.taxId = '';
    newVendor.paymentTerms = '';
    newVendor.contacts[0].name = '';
    newVendor.contacts[0].phone = '';
    newVendor.contacts[0].email = '';
    newVendor.notes = '';
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to create vendor' });
  } finally {
    creating.value = false;
  }
};

const editVendor = (row: Vendor) => {
  selectedVendor.value = {
    ...row,
    contacts: row.contacts.map(contact => ({ ...contact }))
  };
  showEditVendorDialog.value = true;
};

const updateVendor = async () => {
  if (!selectedVendor.value) return;
  updating.value = true;
  try {
    const vendor = await vendorStore.updateVendor(selectedVendor.value._id, selectedVendor.value);
    $q.notify({ type: 'positive', message: `Vendor ${vendor.name} updated` });
    showEditVendorDialog.value = false;
    selectedVendor.value = null;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to update vendor' });
  } finally {
    updating.value = false;
  }
};

onMounted(() => {
  vendorStore.fetchVendors();
});

</script>
