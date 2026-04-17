<template>
  <q-card class="glass-card q-pa-md">
    <q-card-section>
      <div class="text-h6">{{ isEdit ? 'Edit Subscription' : 'Add Subscription' }}</div>
    </q-card-section>

    <q-card-section>
      <q-form ref="subscriptionForm" @submit="saveSubscription" class="q-gutter-md">
        <q-select
          v-model="localSubscription.customerId"
          :options="customerOptions"
          label="Customer"
          outlined
          option-value="_id"
          option-label="fullName"
          emit-value
          map-options
          :rules="[val => !!val || 'Customer is required']"
          :disable="!canEdit"
        />

        <q-select
          v-model="localSubscription.plan"
          :options="planOptions"
          label="Plan"
          outlined
          emit-value
          map-options
          :rules="[val => !!val || 'Plan is required']"
          :disable="!canEdit"
        />

        <q-select
          v-model="localSubscription.status"
          :options="statusOptions"
          label="Status"
          outlined
          emit-value
          map-options
          :rules="[val => !!val || 'Status is required']"
          :disable="!canEdit"
        />

        <q-select
          v-model="localSubscription.billingFrequency"
          :options="frequencyOptions"
          label="Billing Frequency"
          outlined
          emit-value
          map-options
          :rules="[val => !!val || 'Billing frequency is required']"
          :disable="!canEdit"
        />

        <q-input
          v-model.number="localSubscription.monthlyAmount"
          label="Monthly Amount"
          type="number"
          prefix="$"
          outlined
          :rules="[val => val > 0 || 'Monthly amount must be positive']"
          :disable="!canEdit"
        />

        <q-input
          v-model.number="localSubscription.annualAmount"
          label="Annual Amount"
          type="number"
          prefix="$"
          outlined
          :rules="[val => val > 0 || 'Annual amount must be positive']"
          :disable="!canEdit"
        />

        <q-input
          v-model="localSubscription.nextBillDate"
          label="Next Bill Date"
          type="date"
          outlined
          :rules="[val => !!val || 'Next bill date is required']"
          :disable="!canEdit"
        />

        <!-- Services -->
        <div class="q-mt-lg">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-subtitle1">Services</div>
            <q-btn
              v-if="canEdit"
              icon="add"
              label="Add Service"
              color="primary"
              flat
              @click="addService"
            />
          </div>

          <q-list bordered separator>
            <q-item v-for="(service, index) in localSubscription.services" :key="index">
              <q-item-section>
                <div class="row q-gutter-md">
                  <q-input
                    v-model="service.type"
                    label="Type"
                    outlined
                    dense
                    class="col-3"
                    :rules="[val => !!val || 'Type is required']"
                    :disable="!canEdit"
                  />
                  <q-input
                    v-model="service.season"
                    label="Season"
                    outlined
                    dense
                    class="col-3"
                    :disable="!canEdit"
                  />
                  <q-input
                    v-model="service.scheduledDate"
                    label="Scheduled Date"
                    type="date"
                    outlined
                    dense
                    class="col-3"
                    :disable="!canEdit"
                  />
                  <q-select
                    v-model="service.status"
                    :options="serviceStatusOptions"
                    label="Status"
                    outlined
                    dense
                    class="col-3"
                    emit-value
                    map-options
                    :disable="!canEdit"
                  />
                </div>
              </q-item-section>
              <q-item-section side top>
                <q-btn
                  v-if="canEdit"
                  icon="delete"
                  flat
                  round
                  color="negative"
                  @click="removeService(index)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div class="row justify-end q-mt-md">
          <q-btn label="Cancel" flat @click="$emit('close')" />
          <q-btn
            v-if="canEdit"
            label="Save"
            type="submit"
            color="primary"
            :loading="saving"
          />
          <div v-else class="text-warning q-pa-sm">You do not have permission to edit subscriptions.</div>
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useCustomerStore } from '@/stores/customerStore'; // Assuming customerStore exists
import { useAuthStore } from '@/stores/auth';

const $q = useQuasar();
const subscriptionStore = useSubscriptionStore();
const customerStore = useCustomerStore(); // Fetch customers
const authStore = useAuthStore();

const props = defineProps({
  subscription: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'saved']);

const saving = ref(false);
const subscriptionForm = ref(null);

const localSubscription = ref({
  customerId: '',
  plan: '',
  status: '',
  billingFrequency: '',
  monthlyAmount: 0,
  annualAmount: 0,
  nextBillDate: '',
  services: []
});

const isEdit = computed(() => !!props.subscription);

const canEdit = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('admin') || roles.includes('manager');
});

// Options
const planOptions = [
  { label: 'Edge', value: 'edge' },
  { label: 'Apex', value: 'apex' }
];

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Cancelled', value: 'cancelled' }
];

const frequencyOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annual', value: 'annual' }
];

const serviceStatusOptions = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
];

// Customer options - assuming fullName is computed in customer model
const customerOptions = computed(() => 
  customerStore.customers.map(c => ({
    _id: c._id,
    fullName: `${c.firstName} ${c.lastName}`
  }))
);

const addService = () => {
  localSubscription.value.services.push({
    type: '',
    season: '',
    scheduledDate: '',
    completedDate: '',
    status: 'scheduled'
  });
};

const removeService = (index: number) => {
  localSubscription.value.services.splice(index, 1);
};

const saveSubscription = async () => {
  if (!canEdit.value) return;

  const valid = await subscriptionForm.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    let savedSubscription;
    if (isEdit.value) {
      savedSubscription = await subscriptionStore.updateSubscription(props.subscription._id, localSubscription.value);
    } else {
      savedSubscription = await subscriptionStore.createSubscription(localSubscription.value);
    }
    $q.notify({ type: 'positive', message: 'Subscription saved successfully' });
    emit('saved', savedSubscription);
    emit('close');
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to save subscription' });
  } finally {
    saving.value = false;
  }
};

watch(() => props.subscription, (newSubscription) => {
  if (newSubscription) {
    localSubscription.value = { ...newSubscription, services: [...newSubscription.services] };
  } else {
    localSubscription.value = {
      customerId: '',
      plan: '',
      status: '',
      billingFrequency: '',
      monthlyAmount: 0,
      annualAmount: 0,
      nextBillDate: '',
      services: []
    };
  }
}, { immediate: true });

onMounted(async () => {
  await customerStore.fetchCustomers(); // Load customers for select
  if (!canEdit.value) {
    $q.notify({ type: 'info', message: 'View-only mode: You lack edit permissions' });
  }
});
</script>
