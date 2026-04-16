<template>
  <q-card class="glass-card q-pa-md" flat>
    <q-card-section>
      <div class="text-h6">{{ pnl.projectNumber }}</div>
      <div class="text-subtitle2 text-grey">Status: {{ pnl.status }}</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row justify-between q-mb-sm">
        <span>Contract Amount:</span>
        <span class="text-weight-bold">${{ pnl.contractAmount.toLocaleString() }}</span>
      </div>
      <div class="row justify-between q-mb-sm">
        <span>Total Payments:</span>
        <span class="text-weight-bold text-positive">${{ pnl.totalPayments.toLocaleString() }}</span>
      </div>
      <div class="row justify-between q-mb-sm">
        <span>Total Expenses:</span>
        <span class="text-weight-bold text-negative">${{ pnl.totalExpenses.toLocaleString() }}</span>
      </div>
      <div class="row justify-between">
        <span>Profit/Loss:</span>
        <span :class="['text-weight-bold', pnl.profit >= 0 ? 'text-positive' : 'text-negative']">
          ${{ pnl.profit.toLocaleString() }}
        </span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

interface PnLData {
  projectId: string;
  projectNumber: string;
  contractAmount: number;
  totalPayments: number;
  totalExpenses: number;
  profit: number;
  status: string;
}

defineProps({
  pnl: {
    type: Object as PropType<PnLData>,
    required: true
  }
});
</script>