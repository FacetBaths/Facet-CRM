<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Vendors Management</div>
      <q-btn
        v-if="canEdit"
        color="primary"
        icon="add"
        label="New Vendor"
        @click="openEditor(null)"
      />
    </div>

    <q-card class="glass-card" flat>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div
            v-for="vendor in vendorStore.vendors"
            :key="vendor._id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <vendor-card :vendor="vendor">
              <template v-slot:actions>
                <q-card-actions align="right">
                  <q-btn
                    v-if="canEdit"
                    flat
                    icon="edit"
                    size="sm"
                    @click="openEditor(vendor)"
                  />
                  <q-btn
                    v-if="canEdit"
                    flat
                    icon="delete"
                    size="sm"
                    color="negative"
                    @click="confirmDelete(vendor)"
                  />
                </q-card-actions>
              </template>
            </vendor-card>
          </div>
          <div v-if="vendorStore.isLoading" class="col-12 text-center q-pa-lg">
            <q-spinner color="primary" size="3em" />
          </div>
          <div v-if="!vendorStore.vendors.length && !vendorStore.isLoading" class="col-12 text-center q-pa-lg text-grey">
            <q-icon name="business" size="48px" class="q-mb-md" />
            <div>No vendors yet</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Vendor Editor Dialog -->
    <q-dialog v-model="showEditor" persistent>
      <vendor-editor
        :vendor="selectedVendor"
        @saved="handleSaved"
        @close="showEditor = false"
      />
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useVendorStore } from '@/stores/vendorStore';
import { useAuthStore } from '@/stores/auth';
import VendorCard from '@/components/VendorCard.vue';
import VendorEditor from '@/components/VendorEditor.vue';

const $q = useQuasar();
const vendorStore = useVendorStore();
const authStore = useAuthStore();

const showEditor = ref(false);
const selectedVendor = ref(null);

const canEdit = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('admin') || roles.includes('manager');
});

const openEditor = (vendor) => {
  selectedVendor.value = vendor;
  showEditor.value = true;
};

const handleSaved = async () => {
  await vendorStore.fetchVendors();
  showEditor.value = false;
};

const confirmDelete = (vendor) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete ${vendor.name}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await vendorStore.deleteVendor(vendor._id);
      $q.notify({ type: 'positive', message: 'Vendor deleted' });
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Failed to delete vendor' });
    }
  });
};

onMounted(async () => {
  await vendorStore.fetchVendors();
});
</script>
