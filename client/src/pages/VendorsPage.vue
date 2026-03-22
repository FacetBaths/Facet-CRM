<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Vendors</div>
      <q-btn color="primary" icon="add" label="New Vendor" />
    </div>

    <q-card flat bordered>
      <q-table
        :rows="[]"
        :columns="columns"
        row-key="_id"
        flat
        dense
      >
        <template v-slot:no-data>
          <div class="full-width row flex-center q-pa-lg text-grey">
            <q-icon name="store" size="48px" class="q-mb-md" />
            <div>No vendors yet</div>
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
const columns = [
  { name: 'name', label: 'Name', align: 'left' },
  { name: 'type', label: 'Type', align: 'left' },
  { name: 'contact', label: 'Contact', align: 'left' },
  { name: 'paymentTerms', label: 'Payment Terms', align: 'left' },
];
</script>
