<template>
  <div>
    <q-input
      v-model="search"
      dense
      outlined
      placeholder="Search products"
      class="q-mb-md"
      color="primary"
    >
      <template v-slot:append>
        <q-icon name="search" />
      </template>
    </q-input>

    <q-table
      :rows="filteredProducts"
      :columns="columns"
      row-key="_id"
      :filter="search"
      :pagination="{ rowsPerPage: 10, sortBy: 'name' }"
      dense
      flat
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" :props="props">
            {{ props.row.name }}
          </q-td>
          <q-td key="description" :props="props">
            {{ props.row.description }}
          </q-td>
          <q-td key="price" :props="props">
            ${{ getPrice(props.row) }}
          </q-td>
          <q-td key="actions" :props="props">
            <q-btn
              dense
              flat
              icon="add"
              color="positive"
              @click="addToCart(props.row)"
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { usePosStore } from '@/stores/posStore';

const productStore = useProductStore();
const posStore = usePosStore();

const search = ref('');

const columns = [
  { name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left' },
  { name: 'description', label: 'Description', field: 'description', align: 'left' },
  { name: 'price', label: 'Price', field: (row) => getPrice(row), sortable: true, align: 'right' },
  { name: 'actions', label: '', align: 'right' },
];

const filteredProducts = computed(() => 
  productStore.products.filter((p) => p.category === 'retail' && p.isActive)
);

const getPrice = (product) => {
  return product.variants[0]?.retailPrice.toFixed(2) || '0.00';
};

const addToCart = (product) => {
  if (product.variants.length === 0) return;
  posStore.addItem({
    productId: product._id,
    variantId: product.variants[0].sku, // Assuming first variant
    name: product.name,
    quantity: 1,
    price: product.variants[0].retailPrice,
  });
};
</script>