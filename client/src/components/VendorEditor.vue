<template>
  <q-card class="glass-card q-pa-md">
    <q-card-section>
      <div class="text-h6">{{ isEdit ? 'Edit Vendor' : 'Add Vendor' }}</div>
    </q-card-section>

    <q-card-section>
      <q-form ref="vendorForm" @submit="saveVendor" class="q-gutter-md">
        <q-input
          v-model="localVendor.name"
          label="Vendor Name"
          outlined
          :rules="[val => !!val || 'Name is required']"
          :disable="!canEdit"
        />

        <q-input
          v-model="localVendor.contactName"
          label="Contact Name"
          outlined
          :rules="[val => !!val || 'Contact name is required']"
          :disable="!canEdit"
        />

        <q-input
          v-model="localVendor.email"
          label="Email"
          type="email"
          outlined
          :rules="[val => !!val || 'Email is required', val => /.+@.+\..+/.test(val) || 'Invalid email']"
          :disable="!canEdit"
        />

        <q-input
          v-model="localVendor.phone"
          label="Phone"
          outlined
          :rules="[val => !!val || 'Phone is required']"
          :disable="!canEdit"
        />

        <q-input
          v-model="localVendor.address.street"
          label="Street Address"
          outlined
          :rules="[val => !!val || 'Street is required']"
          :disable="!canEdit"
        />

        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-input
              v-model="localVendor.address.city"
              label="City"
              outlined
              :rules="[val => !!val || 'City is required']"
              :disable="!canEdit"
            />
          </div>
          <div class="col-3">
            <q-input
              v-model="localVendor.address.state"
              label="State"
              outlined
              maxlength="2"
              :rules="[val => !!val || 'State is required']"
              :disable="!canEdit"
            />
          </div>
          <div class="col-3">
            <q-input
              v-model="localVendor.address.zip"
              label="ZIP"
              outlined
              :rules="[val => !!val || 'ZIP is required']"
              :disable="!canEdit"
            />
          </div>
        </div>

        <q-input
          v-model="localVendor.notes"
          label="Notes"
          type="textarea"
          outlined
          :disable="!canEdit"
        />

        <q-toggle
          v-model="localVendor.isActive"
          label="Active Vendor"
          color="positive"
          :disable="!canEdit"
        />

        <div class="row justify-end q-mt-md">
          <q-btn label="Cancel" flat @click="$emit('close')" />
          <q-btn
            v-if="canEdit"
            label="Save"
            type="submit"
            color="primary"
            :loading="saving"
          />
          <div v-else class="text-warning q-pa-sm">You do not have permission to edit vendors.</div>
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useVendorStore } from '@/stores/vendorStore';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const vendorStore = useVendorStore();
const authStore = useAuthStore();

const props = defineProps({
  vendor: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'saved']);

const saving = ref(false);
const vendorForm = ref(null);

const localVendor = ref({
  name: '',
  contactName: '',
  email: '',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    zip: ''
  },
  notes: '',
  isActive: true
});

const isEdit = computed(() => !!props.vendor);

const canEdit = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('admin') || roles.includes('manager');
});

const saveVendor = async () => {
  if (!canEdit.value) return;

  const valid = await vendorForm.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    let savedVendor;
    if (isEdit.value) {
      savedVendor = await vendorStore.updateVendor(props.vendor._id, localVendor.value);
    } else {
      savedVendor = await vendorStore.createVendor(localVendor.value);
    }
    $q.notify({ type: 'positive', message: 'Vendor saved successfully' });
    emit('saved', savedVendor);
    emit('close');
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to save vendor' });
  } finally {
    saving.value = false;
  }
};

watch(() => props.vendor, (newVendor) => {
  if (newVendor) {
    localVendor.value = { ...newVendor, address: { ...newVendor.address } };
  } else {
    localVendor.value = {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: ''
      },
      notes: '',
      isActive: true
    };
  }
}, { immediate: true });
</script>
