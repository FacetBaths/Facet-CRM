<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Customers</div>
      <q-btn color="primary" icon="add" label="New Customer" @click="showNewCustomerDialog = true" />
    </div>

    <q-card flat bordered>
      <q-table
        :rows="customerStore.customers"
        :columns="columns"
        row-key="_id"
        :loading="customerStore.isLoading"
        flat
        dense
        @row-click="(evt, row) => $router.push(`/customers/${row._id}`)"
      >
        <template v-slot:body-cell-name="{ row }">
          <q-td>
            {{ row.firstName }} {{ row.lastName }}
          </q-td>
        </template>
        <template v-slot:body-cell-phone="{ row }">
          <q-td>
            {{ row.contacts?.[0]?.phone }}
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- New Customer Dialog -->
    <q-dialog v-model="showNewCustomerDialog" persistent>
      <q-card style="min-width: 450px">
        <q-card-section>
          <div class="text-h6">New Customer</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="createCustomer" class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input v-model="newCustomer.firstName" label="First Name" outlined required />
              </div>
              <div class="col-6">
                <q-input v-model="newCustomer.lastName" label="Last Name" outlined required />
              </div>
            </div>
            
            <q-input v-model="newCustomer.contacts[0].phone" label="Phone" outlined required type="tel" />
            <q-input v-model="newCustomer.contacts[0].email" label="Email" outlined type="email" />
            
            <q-input v-model="newCustomer.contacts[0].address.street" label="Street Address" outlined />
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model="newCustomer.contacts[0].address.city" label="City" outlined />
              </div>
              <div class="col-3">
                <q-input v-model="newCustomer.contacts[0].address.state" label="State" outlined maxlength="2" />
              </div>
              <div class="col-3">
                <q-input v-model="newCustomer.contacts[0].address.zip" label="ZIP" outlined />
              </div>
            </div>

            <q-input v-model="newCustomer.referralSource" label="Referral Source" outlined />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Cancel" flat v-close-popup />
              <q-btn label="Create" type="submit" color="primary" :loading="creating" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCustomerStore } from '@/stores/customers';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();
const customerStore = useCustomerStore();

const showNewCustomerDialog = ref(false);
const creating = ref(false);

const newCustomer = reactive({
  firstName: '',
  lastName: '',
  contacts: [{
    type: 'primary',
    name: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: 'IL',
      zip: '',
    },
  }],
  referralSource: '',
});

const columns = [
  { name: 'name', label: 'Name', align: 'left', sortable: true },
  { name: 'phone', label: 'Phone', align: 'left' },
  { name: 'referralSource', label: 'Referral', field: 'referralSource', align: 'left', sortable: true },
  { name: 'createdAt', label: 'Created', field: 'createdAt', format: (val: string) => new Date(val).toLocaleDateString(), sortable: true },
];

const createCustomer = async () => {
  // Set contact name
  newCustomer.contacts[0].name = `${newCustomer.firstName} ${newCustomer.lastName}`;
  
  creating.value = true;
  try {
    const customer = await customerStore.createCustomer(newCustomer);
    $q.notify({ type: 'positive', message: `Customer ${customer.firstName} ${customer.lastName} created` });
    showNewCustomerDialog.value = false;
    // Reset form
    newCustomer.firstName = '';
    newCustomer.lastName = '';
    newCustomer.contacts[0].phone = '';
    newCustomer.contacts[0].email = '';
    newCustomer.referralSource = '';
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to create customer' });
  } finally {
    creating.value = false;
  }
};

onMounted(() => {
  customerStore.fetchCustomers();
});
</script>
