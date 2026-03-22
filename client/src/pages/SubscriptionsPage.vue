<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Subscriptions</div>
      <q-btn color="primary" icon="add" label="New Subscription" />
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
            <q-icon name="subscriptions" size="48px" class="q-mb-md" />
            <div>No subscriptions yet</div>
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
const columns = [
  { name: 'customer', label: 'Customer', align: 'left' },
  { name: 'plan', label: 'Plan', align: 'left' },
  { name: 'status', label: 'Status', align: 'left' },
  { name: 'nextBill', label: 'Next Bill', align: 'left' },
  { name: 'amount', label: 'Amount', align: 'right' },
];
</script>
