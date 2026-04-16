<template>
  <q-card class="glass-card q-pa-md">
    <q-card-section>
      <div class="text-h6">File Upload</div>
    </q-card-section>

    <q-card-section>
      <q-uploader
        url="/api/uploads"
        label="Upload Files"
        multiple
        auto-upload
        :factory="uploadFactory"
        @uploaded="onUploaded"
        @rejected="onRejected"
      />
    </q-card-section>

    <q-card-section v-if="uploads.length > 0">
      <q-list bordered separator>
        <q-item v-for="upload in uploads" :key="upload._id">
          <q-item-section>
            <q-item-label>{{ upload.filename }}</q-item-label>
            <q-item-label caption>Uploaded: {{ upload.uploadedAt }}</q-item-label>
            <q-img v-if="isImage(upload.filename)" :src="upload.url" style="max-width: 200px;" />
          </q-item-section>
          <q-item-section side>
            <q-btn icon="delete" flat round dense @click="deleteFile(upload._id)" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFileUploadStore } from '@/stores/fileUploadStore';
import { useQuasar } from 'quasar';

const props = defineProps({
  relatedId: {
    type: String,
    required: true
  },
  relatedType: {
    type: String as import('vue').PropType<'project' | 'customer'>,
    required: true
  }
});

const $q = useQuasar();
const store = useFileUploadStore();
const uploads = ref(store.uploads);

store.fetchUploads(props.relatedId, props.relatedType);

const uploadFactory = (files: File[]) => {
  return {
    url: '/api/uploads',
    method: 'POST',
    formFields: [
      { name: 'relatedId', value: props.relatedId },
      { name: 'relatedType', value: props.relatedType }
    ]
  };
};

const onUploaded = (info: any) => {
  store.fetchUploads(props.relatedId, props.relatedType);
  $q.notify({ type: 'positive', message: 'File uploaded successfully' });
};

const onRejected = () => {
  $q.notify({ type: 'negative', message: 'File rejected' });
};

const deleteFile = async (id: string) => {
  try {
    await store.deleteUpload(id);
    $q.notify({ type: 'positive', message: 'File deleted' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to delete file' });
  }
};

const isImage = (filename: string) => {
  return /\.(jpg|jpeg|png|gif)$/i.test(filename);
};
</script>
