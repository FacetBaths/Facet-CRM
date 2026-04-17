<template>
  <q-card class="glass-card q-pa-md" flat>
    <q-card-section>
      <div class="text-h6">{{ product.name }}</div>
      <div class="text-subtitle2 text-grey">{{ product.description }}</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="text-caption text-grey-7 q-mb-sm">Category: {{ product.category }}</div>
      <div class="text-caption text-grey-7 q-mb-sm">Type: {{ product.type }}</div>
      <div class="text-caption text-grey-7 q-mb-sm">Active: {{ product.isActive ? 'Yes' : 'No' }}</div>
    </q-card-section>

    <q-expansion-item
      icon="list"
      label="Variants"
      :caption="`${product.variants.length} variants`"
      dense
    >
      <q-list separator dense>
        <q-item v-for="(variant, index) in product.variants" :key="index">
          <q-item-section>
            <q-item-label>SKU: {{ variant.sku }}</q-item-label>
            <q-item-label caption>Size: {{ variant.size || 'N/A' }}</q-item-label>
            <q-item-label caption>Color: {{ variant.color || 'N/A' }}</q-item-label>
            <q-item-label caption>Cost: ${{ variant.costPrice.toFixed(2) }}</q-item-label>
            <q-item-label caption>Retail: ${{ variant.retailPrice.toFixed(2) }}</q-item-label>
            <q-item-label caption>Active: {{ variant.isActive ? 'Yes' : 'No' }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>

    <slot name="actions"></slot>
  </q-card>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

interface Variant {
  sku: string;
  size?: string;
  color?: string;
  costPrice: number;
  retailPrice: number;
  isActive: boolean;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  category: 'materials' | 'labor' | 'service' | 'package' | 'retail';
  type: 'physical' | 'service' | 'package';
  variants: Variant[];
  isActive: boolean;
}

defineProps({
  product: {
    type: Object as PropType<Product>,
    required: true
  }
});
</script>
