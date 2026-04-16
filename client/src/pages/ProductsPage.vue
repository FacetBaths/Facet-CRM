<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Products Catalog</div>
      <q-btn
        v-if="canEdit"
        color="primary"
        icon="add"
        label="New Product"
        @click="openEditor(null)"
      />
    </div>

    <q-card class="glass-card" flat>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div
            v-for="product in productStore.products"
            :key="product._id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <product-card :product="product">
              <template v-slot:actions>
                <q-card-actions align="right">
                  <q-btn
                    v-if="canEdit"
                    flat
                    icon="edit"
                    size="sm"
                    @click="openEditor(product)"
                  />
                  <q-btn
                    v-if="canEdit"
                    flat
                    icon="delete"
                    size="sm"
                    color="negative"
                    @click="confirmDelete(product)"
                  />
                </q-card-actions>
              </template>
            </product-card>
          </div>
          <div v-if="productStore.isLoading" class="col-12 text-center q-pa-lg">
            <q-spinner color="primary" size="3em" />
          </div>
          <div v-if="!productStore.products.length && !productStore.isLoading" class="col-12 text-center q-pa-lg text-grey">
            <q-icon name="inventory_2" size="48px" class="q-mb-md" />
            <div>No products yet</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Product Editor Dialog -->
    <q-dialog v-model="showEditor" persistent>
      <product-editor
        :product="selectedProduct"
        @saved="handleSaved"
        @close="showEditor = false"
      />
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useProductStore } from '@/stores/productStore';
import { useAuthStore } from '@/stores/auth';
import ProductEditor from '@/components/ProductEditor.vue';

const $q = useQuasar();
const productStore = useProductStore();
const authStore = useAuthStore();

const showEditor = ref(false);
const selectedProduct = ref(null);

const canEdit = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('admin') || roles.includes('manager');
});



const openEditor = (product) => {
  selectedProduct.value = product;
  showEditor.value = true;
};

const handleSaved = async () => {
  try {
    await productStore.fetchProducts();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to refresh products' });
  }
  showEditor.value = false;
};

const confirmDelete = (product) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete ${product.name}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await productStore.deleteProduct(product._id);
      $q.notify({ type: 'positive', message: 'Product deleted' });
      await productStore.fetchProducts();
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Failed to delete product or refresh list' });
    }
  });
};

onMounted(async () => {
  try {
    await productStore.fetchProducts();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to load products' });
  }
});
</script>
