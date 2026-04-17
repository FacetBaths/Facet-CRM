<template>
  <q-card class="glass-card q-pa-md" flat>
    <q-card-section>
      <div class="text-h6">{{ subscription.plan.toUpperCase() }} Plan</div>
      <div class="text-subtitle2 text-grey">Customer: {{ subscription.customerId.firstName }} {{ subscription.customerId.lastName }}</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="text-caption text-grey-7 q-mb-sm">Status: {{ subscription.status }}</div>
      <div class="text-caption text-grey-7 q-mb-sm">Billing: {{ subscription.billingFrequency }} - ${{ subscription.billingFrequency === 'monthly' ? subscription.monthlyAmount : subscription.annualAmount }}</div>
      <div class="text-caption text-grey-7 q-mb-sm">Next Bill: {{ formatDate(subscription.nextBillDate) }}</div>
    </q-card-section>

    <q-expansion-item
      icon="list"
      label="Services"
      :caption="`${subscription.services.length} services`"
      dense
    >
      <q-list separator dense>
        <q-item v-for="(service, index) in subscription.services" :key="index">
          <q-item-section>
            <q-item-label>{{ service.type }} ({{ service.season }})</q-item-label>
            <q-item-label caption>Scheduled: {{ formatDate(service.scheduledDate) }}</q-item-label>
            <q-item-label caption>Status: {{ service.status }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>

    <slot name="actions"></slot>
  </q-card>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

interface Subscription {
  _id: string;
  customerId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  plan: 'edge' | 'apex';
  status: 'active' | 'paused' | 'cancelled';
  billingFrequency: 'monthly' | 'annual';
  monthlyAmount: number;
  annualAmount: number;
  nextBillDate: Date;
  services: {
    type: string;
    season: string;
    scheduledDate: Date;
    completedDate: Date;
    status: 'scheduled' | 'completed' | 'cancelled';
  }[];
  payments: {
    amount: number;
    date: Date;
    status: 'pending' | 'completed' | 'failed';
    method: string;
  }[];
  createdAt: Date;
}

defineProps({
  subscription: {
    type: Object as PropType<Subscription>,
    required: true
  }
});

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>
