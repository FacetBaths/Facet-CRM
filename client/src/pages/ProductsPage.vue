<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Products</div>
      <q-btn color="primary" icon="add" label="New Product" />
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
            <q-icon name="inventory_2" size="48px" class="q-mb-md" />
            <div>No products yet</div>
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
const columns = [
  { name: 'name', label: 'Name', align: 'left' },
  { name: 'category', label: 'Category', align: 'left' },
  { name: 'type', label: 'Type', align: 'left' },
  { name: 'price', label: 'Price', align: 'right' },
  { name: 'vendor', label: 'Vendor', align: 'left' },
];
</script>
