<template>
  <q-card class="glass-card q-pa-md" flat>
    <q-card-section>
      <div class="text-h6">{{ vendor.name }}</div>
      <div class="text-subtitle2 text-grey">{{ vendor.contactName }}</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="text-caption text-grey-7 q-mb-sm">Email: {{ vendor.email }}</div>
      <div class="text-caption text-grey-7 q-mb-sm">Phone: {{ vendor.phone }}</div>
      <div class="text-caption text-grey-7 q-mb-sm">Address: {{ formatAddress(vendor.address) }}</div>
      <div class="text-caption text-grey-7 q-mb-sm">Notes: {{ vendor.notes || 'N/A' }}</div>
      <div class="text-caption text-grey-7 q-mb-sm">Active: {{ vendor.isActive ? 'Yes' : 'No' }}</div>
    </q-card-section>

    <slot name="actions"></slot>
  </q-card>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface Vendor {
  _id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: Address;
  notes: string;
  isActive: boolean;
}

defineProps({
  vendor: {
    type: Object as PropType<Vendor>,
    required: true
  }
});

const formatAddress = (address: Address) => {
  return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
};
</script>
