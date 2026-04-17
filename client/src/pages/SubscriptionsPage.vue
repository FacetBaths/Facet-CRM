<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Subscriptions Dashboard</div>
      <q-btn
        v-if="canEdit"
        color="primary"
        icon="add"
        label="New Subscription"
        @click="openEditor(null)"
      />
    </div>

    <q-card class="glass-card" flat>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div
            v-for="subscription in subscriptionStore.subscriptions"
            :key="subscription._id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <subscription-card :subscription="subscription">
              <template v-slot:actions>
                <q-card-actions align="right">
                  <q-btn
                    v-if="canEdit"
                    flat
                    icon="edit"
                    size="sm"
                    @click="openEditor(subscription)"
                  />
                  <q-btn
                    v-if="canEdit"
                    flat
                    icon="delete"
                    size="sm"
                    color="negative"
                    @click="confirmDelete(subscription)"
                  />
                </q-card-actions>
              </template>
            </subscription-card>
          </div>
          <div v-if="subscriptionStore.isLoading" class="col-12 text-center q-pa-lg">
            <q-spinner color="primary" size="3em" />
          </div>
          <div v-if="!subscriptionStore.subscriptions.length && !subscriptionStore.isLoading" class="col-12 text-center q-pa-lg text-grey">
            <q-icon name="subscriptions" size="48px" class="q-mb-md" />
            <div>No subscriptions yet</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Subscription Editor Dialog -->
    <q-dialog v-model="showEditor" persistent>
      <subscription-editor
        :subscription="selectedSubscription"
        @saved="handleSaved"
        @close="showEditor = false"
      />
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useAuthStore } from '@/stores/auth';
import SubscriptionCard from '@/components/SubscriptionCard.vue';
import SubscriptionEditor from '@/components/SubscriptionEditor.vue';

const $q = useQuasar();
const subscriptionStore = useSubscriptionStore();
const authStore = useAuthStore();

const showEditor = ref(false);
const selectedSubscription = ref(null);

const canEdit = computed(() => {
  const roles = authStore.user?.roles || [];
  return roles.includes('admin') || roles.includes('manager');
});

const openEditor = (subscription) => {
  selectedSubscription.value = subscription;
  showEditor.value = true;
};

const handleSaved = async () => {
  try {
    await subscriptionStore.fetchSubscriptions();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to refresh subscriptions' });
  }
  showEditor.value = false;
};

const confirmDelete = (subscription) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete this subscription for ${subscription.customerId.firstName} ${subscription.customerId.lastName}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await subscriptionStore.deleteSubscription(subscription._id);
      $q.notify({ type: 'positive', message: 'Subscription deleted' });
      await subscriptionStore.fetchSubscriptions();
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Failed to delete subscription or refresh list' });
    }
  });
};

onMounted(async () => {
  try {
    await subscriptionStore.fetchSubscriptions();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to load subscriptions' });
  }
});
</script>
