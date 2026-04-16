<template>
  <q-card class="glass-card q-pa-md">
    <q-card-section>
      <div class="text-h6">{{ isEdit ? 'Edit Product' : 'Add Product' }}</div>
    </q-card-section>

    <q-card-section>
      <q-form ref="productForm" @submit="saveProduct" class="q-gutter-md">
        <q-input
          v-model="localProduct.name"
          label="Name"
          outlined
          :rules="[val => !!val || 'Name is required']"
          :disable="!canEdit"
        />

        <q-input
          v-model="localProduct.description"
          label="Description"
          type="textarea"
          outlined
          :disable="!canEdit"
        />

        <q-select
          v-model="localProduct.category"
          :options="categoryOptions"
          label="Category"
          outlined
          emit-value
          map-options
          :rules="[val => !!val || 'Category is required']"
          :disable="!canEdit"
        />

        <q-select
          v-model="localProduct.type"
          :options="typeOptions"
          label="Type"
          outlined
          emit-value
          map-options
          :rules="[val => !!val || 'Type is required']"
          :disable="!canEdit"
        />

        <!-- Variants -->
        <div class="q-mt-lg">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-subtitle1">Variants</div>
            <q-btn
              v-if="canEdit"
              icon="add"
              label="Add Variant"
              color="primary"
              flat
              @click="addVariant"
            />
          </div>

          <q-list bordered separator>
            <q-item v-for="(variant, index) in localProduct.variants" :key="index">
              <q-item-section>
                <div class="row q-gutter-md">
                  <q-input
                    v-model="variant.sku"
                    label="SKU"
                    outlined
                    dense
                    class="col-3"
                    :rules="[val => !!val || 'SKU is required']"
                    :disable="!canEdit"
                  />
                  <q-input
                    v-model="variant.size"
                    label="Size"
                    outlined
                    dense
                    class="col-2"
                    :disable="!canEdit"
                  />
                  <q-input
                    v-model="variant.color"
                    label="Color"
                    outlined
                    dense
                    class="col-2"
                    :disable="!canEdit"
                  />
                  <q-input
                    v-model.number="variant.costPrice"
                    label="Cost Price"
                    type="number"
                    outlined
                    dense
                    class="col-2"
                    prefix="$"
                    :rules="[val => val >= 0 || 'Cost must be positive']"
                    :disable="!canEdit"
                  />
                  <q-input
                    v-model.number="variant.retailPrice"
                    label="Retail Price"
                    type="number"
                    outlined
                    dense
                    class="col-2"
                    prefix="$"
                    :rules="[val => val >= 0 || 'Retail must be positive']"
                    :disable="!canEdit"
                  />
                </div>
                <q-toggle
                  v-model="variant.isActive"
                  label="Active"
                  color="positive"
                  :disable="!canEdit"
                />
              </q-item-section>
              <q-item-section side top>
                <q-btn
                  v-if="canEdit"
                  icon="delete"
                  flat
                  round
                  color="negative"
                  @click="removeVariant(index)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-toggle
          v-model="localProduct.isActive"
          label="Active Product"
          color="positive"
          :disable="!canEdit"
        />

        <div class="row justify-end q-mt-md">
          <q-btn label="Cancel" flat @click="$emit('close')" />
          <q-btn
            v-if="canEdit"
            label="Save"
            type="submit"
            color="primary"
            :loading="saving"
          />
          <div v-else class="text-warning q-pa-sm">You do not have permission to edit products.</div>
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useProductStore } from '@/stores/productStore';
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const productStore = useProductStore();
const authStore = useAuthStore();

const props = defineProps({
  product: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'saved']);

const saving = ref(false);
const productForm = ref(null);

const localProduct = ref({
  name: '',
  description: '',
  category: '',
  type: '',
  variants: [],
  isActive: true
});

const isEdit = computed(() => !!props.product);

const canEdit = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('admin') || roles.includes('manager');
});

const categoryOptions = [
  { label: 'Materials', value: 'materials' },
  { label: 'Labor', value: 'labor' },
  { label: 'Service', value: 'service' },
  { label: 'Package', value: 'package' },
  { label: 'Retail', value: 'retail' }
];

const typeOptions = [
  { label: 'Physical', value: 'physical' },
  { label: 'Service', value: 'service' },
  { label: 'Package', value: 'package' }
];

const addVariant = () => {
  localProduct.value.variants.push({
    sku: '',
    size: '',
    color: '',
    costPrice: 0,
    retailPrice: 0,
    isActive: true
  });
};

const removeVariant = (index: number) => {
  localProduct.value.variants.splice(index, 1);
};

const saveProduct = async () => {
  if (!canEdit.value) return;

  const valid = await productForm.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    let savedProduct;
    if (isEdit.value) {
      savedProduct = await productStore.updateProduct(props.product._id, localProduct.value);
    } else {
      savedProduct = await productStore.createProduct(localProduct.value);
    }
    $q.notify({ type: 'positive', message: 'Product saved successfully' });
    emit('saved', savedProduct);
    emit('close');
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to save product' });
  } finally {
    saving.value = false;
  }
};

watch(() => props.product, (newProduct) => {
  if (newProduct) {
    localProduct.value = { ...newProduct, variants: [...newProduct.variants] };
  } else {
    localProduct.value = {
      name: '',
      description: '',
      category: '',
      type: '',
      variants: [],
      isActive: true
    };
  }
}, { immediate: true });

onMounted(() => {
  if (!canEdit.value) {
    $q.notify({ type: 'info', message: 'View-only mode: You lack edit permissions' });
  }
});
</script>
