<template>
  <q-page class="q-pa-md" style="background: linear-gradient(135deg, #9945FF, #14F195); min-height: 100vh;">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-white">Products Catalog</div>
      <q-btn color="secondary" icon="add" label="New Product" @click="openAddDialog" />
    </div>

    <q-card class="glass-card">
      <q-table
        :rows="products"
        :columns="columns"
        row-key="_id"
        :loading="isLoading"
        flat
        dense
        :pagination="{ rowsPerPage: 20 }"
      >
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn dense flat icon="edit" @click="openEditDialog(props.row)" />
            <q-btn dense flat icon="delete" @click="deactivateProduct(props.row._id)" />
          </q-td>
        </template>
        <template v-slot:no-data>
          <div class="full-width row flex-center q-pa-lg text-grey">
            <q-icon name="inventory_2" size="48px" class="q-mb-md" />
            <div>No products yet</div>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="glass-card" style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">{{ isEdit ? 'Edit Product' : 'Add Product' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveProduct">
            <q-input v-model="form.name" label="Name" filled class="q-mb-md" />
            <q-input v-model="form.description" label="Description" filled class="q-mb-md" type="textarea" />
            <q-select 
              v-model="form.category" 
              label="Category" 
              filled 
              class="q-mb-md" 
              :options="categoryOptions" 
            />
            <q-select 
              v-model="form.type" 
              label="Type" 
              filled 
              class="q-mb-md" 
              :options="typeOptions" 
            />
            <q-select 
              v-model="form.defaultVendorId" 
              label="Default Vendor" 
              filled 
              class="q-mb-md" 
              :options="vendors.map(v => ({ value: v._id, label: v.name }))" 
              option-value="_id"
              option-label="name"
            />
            <q-toggle v-model="form.isActive" label="Active" />

            <div class="text-subtitle1 q-mt-md q-mb-sm">Variants</div>
            <q-list bordered separator>
              <q-item v-for="(variant, index) in form.variants" :key="index" clickable v-ripple>
                <q-item-section>
                  <q-input v-model="variant.sku" label="SKU" dense />
                  <q-input v-model="variant.size" label="Size" dense />
                  <q-input v-model="variant.color" label="Color" dense />
                  <q-input v-model.number="variant.costPrice" label="Cost Price" dense type="number" />
                  <q-input v-model.number="variant.retailPrice" label="Retail Price" dense type="number" />
                  <q-toggle v-model="variant.isActive" label="Active" />
                </q-item-section>
                <q-item-section side>
                  <q-btn flat icon="delete" @click="removeVariant(index)" />
                </q-item-section>
              </q-item>
            </q-list>
            <q-btn label="Add Variant" color="primary" @click="addVariant" class="q-mt-sm" />

            <q-card-actions align="right" class="q-mt-md">
              <q-btn flat label="Cancel" color="negative" v-close-popup />
              <q-btn flat label="Save" color="primary" type="submit" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useProductStore } from '../stores/productStore';
import { useVendorStore } from '../stores/vendors';

const productStore = useProductStore();
const vendorStore = useVendorStore();

const products = productStore.products;
const isLoading = productStore.isLoading;

const showDialog = ref(false);
const isEdit = ref(false);
const form = ref({
  _id: '',
  name: '',
  description: '',
  category: '',
  type: '',
  defaultVendorId: '',
  variants: [] as ProductVariant[],
  isActive: true,
});

const categoryOptions = [
  { value: 'materials', label: 'Materials' },
  { value: 'labor', label: 'Labor' },
  { value: 'service', label: 'Service' },
  { value: 'package', label: 'Package' },
  { value: 'retail', label: 'Retail' },
];

const typeOptions = [
  { value: 'physical', label: 'Physical' },
  { value: 'service', label: 'Service' },
  { value: 'package', label: 'Package' },
];

const columns = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'category', label: 'Category', field: 'category', align: 'left', sortable: true },
  { name: 'type', label: 'Type', field: 'type', align: 'left', sortable: true },
  { name: 'variants', label: 'Variants', field: (row: Product) => row.variants.length, align: 'right' },
  { name: 'vendor', label: 'Vendor', field: (row: Product) => row.defaultVendorId?.name || '', align: 'left' },
  { name: 'actions', label: 'Actions', align: 'right' },
];

const vendors = vendorStore.vendors;

onMounted(async () => {
  await productStore.fetchProducts();
  await vendorStore.fetchVendors();
});

const openAddDialog = () => {
  form.value = {
    _id: '',
    name: '',
    description: '',
    category: '',
    type: '',
    defaultVendorId: '',
    variants: [],
    isActive: true,
  };
  isEdit.value = false;
  showDialog.value = true;
};

const openEditDialog = (product: Product) => {
  form.value = { ...product, defaultVendorId: product.defaultVendorId?._id || '' };
  isEdit.value = true;
  showDialog.value = true;
};

const addVariant = () => {
  form.value.variants.push({
    sku: '',
    size: '',
    color: '',
    costPrice: 0,
    retailPrice: 0,
    isActive: true,
  });
};

const removeVariant = (index: number) => {
  form.value.variants.splice(index, 1);
};

const saveProduct = async () => {
  try {
    if (isEdit.value) {
      await productStore.updateProduct(form.value._id, form.value);
    } else {
      await productStore.createProduct(form.value);
    }
    showDialog.value = false;
  } catch (error) {
    // error handled in store
  }
};

const deactivateProduct = async (id: string) => {
  if (confirm('Are you sure to deactivate this product?')) {
    await productStore.deactivateProduct(id);
  }
};
</script>