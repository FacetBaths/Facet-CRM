<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">File Uploads</div>
      <q-btn v-if="canUpload" color="primary" icon="add" label="Upload File" @click="showUploadDialog = true" />
    </div>

    <!-- Filters -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-input v-model="filters.search" label="Search" dense outlined clearable>
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-6 col-md-3">
        <q-select
          v-model="filters.relatedType"
          :options="typeOptions"
          label="Related Type"
          dense
          outlined
          clearable
          emit-value
          map-options
        />
      </div>
      <div class="col-12 col-md-2">
        <q-btn color="primary" label="Filter" @click="fetchUploads" class="full-width" />
      </div>
    </div>

    <!-- Uploads Table -->
    <q-card class="glass-card">\n      <q-table :rows="fileUploadStore.uploads" :columns="columns" row-key="_id" :loading="fileUploadStore.isLoading" dense >\n        <template v-slot:body-cell-filename="{ row }">\n          <q-td>\n            <a :href="row.url" target="_blank">{{ row.filename }}</a>\n          </q-td>\n        </template>\n        <template v-slot:body-cell-actions="{ row }">\n          <q-td>\n            <q-btn icon="delete" flat round dense @click="deleteUpload(row._id)" v-if="canManage" />\n          </q-td>\n        </template>\n      </q-table>\n    </q-card>

    <!-- Upload Dialog -->
    <q-dialog v-model="showUploadDialog" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section class="row items-center">
          <div class="text-h6">Upload File</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleUpload" class="q-gutter-md">
            <q-select
              v-model="uploadForm.relatedType"
              :options="typeOptions"
              label="Related Type"
              outlined
              required
              emit-value
              map-options
            />

            <q-select
              v-model="uploadForm.relatedId"
              :options="relatedOptions"
              label="Related Item"
              outlined
              required
              option-value="_id"
              option-label="title"
              emit-value
              use-input
              @filter="filterRelated"
            />

            <q-file v-model="uploadForm.file" label="Select File" outlined required />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" flat v-close-popup />
              <q-btn label="Upload" type="submit" color="primary" :loading="uploading" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useFileUploadStore } from '@/stores/fileUploadStore';
import { useProjectStore } from '@/stores/projects';
import { useCustomerStore } from '@/stores/customers';
import { useUserStore } from '@/stores/users';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const fileUploadStore = useFileUploadStore();
const projectStore = useProjectStore();
const customerStore = useCustomerStore();
const userStore = useUserStore();

const showUploadDialog = ref(false);
const uploading = ref(false);

const filters = reactive({
  search: '',
  relatedType: '',
});

const uploadForm = reactive({
  relatedType: 'project',
  relatedId: '',
  file: null as File | null,
});

const typeOptions = [
  { label: 'Project', value: 'project' },
  { label: 'Customer', value: 'customer' },
];

const relatedOptions = ref([]);

const columns = [
  { name: 'filename', label: 'Filename', field: 'filename', align: 'left', sortable: true },
  { name: 'relatedType', label: 'Type', field: 'relatedType', sortable: true },
  { name: 'relatedId', label: 'Related', field: 'relatedId', sortable: true },
  { name: 'uploadedAt', label: 'Uploaded', field: 'uploadedAt', format: (val: string) => new Date(val).toLocaleString(), sortable: true },
  { name: 'actions', label: 'Actions', align: 'center' },
];

const canUpload = computed(() => {
  const allowedRoles = ['admin', 'manager', 'sales'];
  return userStore.user?.roles?.some(role => allowedRoles.includes(role));
});

const canManage = computed(() => canUpload.value); // Same for now

const fetchUploads = () => {
  fileUploadStore.fetchUploads(undefined, filters.relatedType);
};

const handleUpload = async () => {
  uploading.value = true;
  try {
    if (!uploadForm.file) throw new Error('No file selected');
    await fileUploadStore.uploadFile(uploadForm.file, uploadForm.relatedId, uploadForm.relatedType);
    $q.notify({ type: 'positive', message: 'File uploaded successfully' });
    showUploadDialog.value = false;
    fetchUploads();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to upload file' });
  } finally {
    uploading.value = false;
  }
};

const deleteUpload = async (id: string) => {
  try {
    await fileUploadStore.deleteUpload(id);
    $q.notify({ type: 'positive', message: 'File deleted' });
    fetchUploads();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to delete file' });
  }
};

const filterRelated = (val: string, update: any) => {
  if (uploadForm.relatedType === 'project') {
    projectStore.filters.search = val;
    projectStore.fetchProjects();
    update(() => {
      relatedOptions.value = projectStore.projects;
    });
  } else {
    customerStore.searchQuery = val;
    customerStore.fetchCustomers();
    update(() => {
      relatedOptions.value = customerStore.customers;
    });
  }
};

watch(() => uploadForm.relatedType, () => {
  uploadForm.relatedId = '';
  relatedOptions.value = [];
  filterRelated('', () => {});
});

onMounted(() => {
  fetchUploads();
  userStore.fetchCurrentUser(); // Assuming this exists
  projectStore.fetchProjects();
  customerStore.fetchCustomers();
});
</script>
