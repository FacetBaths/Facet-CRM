<template>
  <q-page class="page-container" v-if="project">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <q-btn
        flat
        icon="arrow_back"
        label="Back"
        @click="$router.push('/projects')"
      />
      <div class="text-h5 text-weight-bold">{{ project.projectNumber }}</div>
      <q-badge
        :color="statusColor(project.status)"
        class="q-px-md q-py-sm text-weight-bold cursor-pointer"
        @click="showStatusChange = true"
      >
        {{ formatStatus(project.status) }}
        <q-tooltip>Click to change status</q-tooltip>
      </q-badge>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Left Column: Project Info -->
      <div class="col-12 col-md-4">
        <!-- Customer Card -->
        <div class="glass-card q-pa-md q-mb-md">
          <div class="text-h6 text-weight-bold q-mb-sm">
            {{ project.title }}
          </div>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-icon name="person" size="20px" />
            <a
              href="#"
              class="text-weight-medium text-primary"
              @click.prevent="
                $router.push(`/customers/${project.customerId?._id}`)
              "
            >
              {{ project.customerId?.firstName }}
              {{ project.customerId?.lastName }}
            </a>
          </div>

          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-icon name="location_on" size="20px" />
            <span
              >{{ project.address?.street }}, {{ project.address?.city }},
              {{ project.address?.state }}</span
            >
          </div>

          <div class="row items-center q-gutter-sm">
            <q-icon name="phone" size="20px" />
            <span>{{ project.customerId?.contacts?.[0]?.phone }}</span>
          </div>
        </div>

        <!-- Assignment Info -->
        <div class="glass-card q-pa-md q-mb-md">
          <div class="text-subtitle2 text-grey-7 q-mb-sm row items-center justify-between">
            <span>Assignment</span>
            <q-btn flat round dense icon="edit" size="sm" @click="openAssignmentDialog" />
          </div>
          
          <div class="q-mb-sm">
            <div class="text-caption text-grey-7">Sales Rep</div>
            <div v-if="project.assignedSalesId" class="text-body2">
              {{ project.assignedSalesId.firstName }} {{ project.assignedSalesId.lastName }}
            </div>
            <div v-else class="text-body2 text-grey-6">Not assigned</div>
          </div>
          
          <div>
            <div class="text-caption text-grey-7">BDC Rep</div>
            <div v-if="project.commission?.bdcRepId" class="text-body2">
              {{ project.commission.bdcRepId.firstName }} {{ project.commission.bdcRepId.lastName }}
            </div>
            <div v-else class="text-body2 text-grey-6">Not assigned</div>
          </div>
        </div>

        <!-- Contract Info -->
        <div class="glass-card q-pa-md q-mb-md">
          <div class="text-subtitle2 text-grey-7 q-mb-sm">Contract</div>
          <div class="row justify-between items-center q-mb-sm">
            <span>Amount:</span>
            <span class="text-h6 text-weight-bold text-primary"
              >${{ project.contractAmount?.toLocaleString() }}</span
            >
          </div>

          <div class="row justify-between items-center q-mb-sm">
            <span>Paid:</span>
            <span class="text-h6 text-weight-bold text-secondary"
              >${{ totalPaid.toLocaleString() }}</span
            >
          </div>

          <div class="row justify-between items-center q-mb-md">
            <span>Balance:</span>
            <span class="text-h6 text-weight-bold"
              >${{ balance.toLocaleString() }}</span
            >
          </div>

          <q-linear-progress
            :value="paymentProgress"
            size="12px"
            rounded
            color="secondary"
            track-color="grey-4"
            class="q-mb-sm"
          />

          <div class="text-caption text-center">
            {{ Math.round(paymentProgress * 100) }}% Paid
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="glass-card q-pa-md">
          <div class="text-subtitle2 text-grey-7 q-mb-sm">Quick Actions</div>
          <div class="column q-gutter-sm">
            <q-btn
              color="primary"
              icon="note_add"
              label="Add Note"
              @click="showAddNote = true"
              unelevated
            />
            <q-btn
              color="secondary"
              icon="task"
              label="Add Task"
              @click="showAddTask = true"
              unelevated
            />
            <q-btn
              color="positive"
              icon="payment"
              label="Record Payment"
              @click="showAddPayment = true"
              unelevated
            />
            <q-btn
              color="warning"
              icon="edit"
              label="Change Order"
              @click="showChangeOrder = true"
              unelevated
            />
            <q-btn
              color="info"
              icon="email"
              label="Send Email"
              @click="showEmailComposer = true"
              unelevated
            />
          </div>
        </div>

        <!-- Commission Card -->
        <div
          class="glass-card q-pa-md q-mt-md"
          v-if="project.commission?.calculatedAt"
        >
          <div
            class="text-subtitle2 text-grey-7 q-mb-sm row items-center justify-between"
          >
            <span>Commission</span>
            <q-btn
              flat
              round
              icon="refresh"
              size="sm"
              @click="showCommissionDialog = true"
              :loading="calculating"
            />
          </div>

          <!-- Sales Commission (Array) -->
          <div v-if="project.commission.salesReps?.length" class="q-mb-sm">
            <div class="text-caption text-grey-7 q-mb-xs">Sales Reps</div>
            <div
              v-for="(rep, index) in project.commission.salesReps"
              :key="index"
              class="row justify-between items-center q-mb-xs"
            >
              <div>
                <div class="text-body2">
                  {{ rep.userId?.firstName }} {{ rep.userId?.lastName }} 
                  <span class="text-grey-6">({{ rep.splitPercent }}%)</span>
                </div>
                <div class="text-caption text-primary">${{ rep.amount?.toLocaleString() }}</div>
              </div>
              <q-btn
                v-if="!rep.paid"
                label="Pay"
                color="positive"
                size="sm"
                @click="markSalesRepPaid(rep.userId?._id)"
              />
              <q-badge v-else color="positive">Paid</q-badge>
            </div>
          </div>

          <!-- BDC Commission -->
          <div v-if="project.commission.bdcRepId" class="q-mb-sm">
            <div class="row justify-between items-center">
              <div>
                <div class="text-caption text-grey-7">BDC</div>
                <div class="text-body2">
                  ${{ project.commission.bdcAmount?.toLocaleString() }}
                </div>
              </div>
              <q-btn
                v-if="!project.commission.bdcPaid"
                label="Pay"
                color="positive"
                size="sm"
                @click="markCommissionPaid('bdc')"
              />
              <q-badge v-else color="positive">Paid</q-badge>
            </div>
          </div>

          <div class="text-caption text-grey-7 q-mt-sm">
            Calculated {{ formatDate(project.commission.calculatedAt) }}
          </div>
        </div>

        <div v-else class="glass-card q-pa-md q-mt-md">
          <q-btn
            color="primary"
            icon="calculate"
            label="Calculate Commission"
            @click="showCommissionDialog = true"
            :loading="calculating"
            class="full-width"
          />
        </div>
      </div>

      <!-- Right Column: Activity Feed -->
      <div class="col-12 col-md-8">
        <div class="glass-card">
          <!-- Activity Header -->
          <div class="q-pa-md border-bottom">
            <div class="row items-center justify-between">
              <div class="text-h6 text-weight-bold">Activity Feed</div>
              <q-btn
                flat
                round
                icon="refresh"
                @click="refreshActivities"
                :loading="loading"
              />
            </div>
          </div>

          <!-- Activity List -->
          <div class="activity-list q-pa-md">
            <div
              v-if="!activities.length"
              class="text-center text-grey q-pa-lg"
            >
              <q-icon name="chat" size="48px" class="q-mb-sm" />
              <div>No activity yet</div>
            </div>

            <div
              v-for="activity in sortedActivities"
              :key="activity._id"
              class="activity-item q-pa-md q-mb-sm"
              :class="`activity-${activity.type}`"
            >
              <div class="row items-start">
                <user-avatar
                  :user="activity.userId"
                  size="sm"
                  class="q-mr-md cursor-pointer"
                  @click="showUserDetail(activity.userId)"
                />
                <div class="col">
                  <div class="row items-center q-gutter-sm q-mb-xs">
                    <q-icon
                      :name="activityIcon(activity.type)"
                      :color="activityColor(activity.type)"
                      size="18px"
                    />
                    <span class="text-weight-medium">{{ activity.content }}</span>
                  </div>
                  <div class="text-caption text-grey-6" :title="formatFullDate(activity.timestamp)">
                    {{ formatRelativeTime(activity.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tasks Section -->
        <div class="glass-card q-mt-md">
          <div class="q-pa-md border-bottom">
            <div class="row items-center justify-between">
              <div class="text-h6 text-weight-bold">Tasks</div>
              <q-btn
                flat
                icon="add"
                label="New Task"
                @click="showAddTask = true"
              />
            </div>
          </div>

          <q-list separator>
            <q-item
              v-for="task in tasks"
              :key="task._id"
              :class="{ 'bg-green-1': task.status === 'completed' }"
            >
              <q-item-section avatar>
                <q-checkbox
                  :model-value="task.status === 'completed'"
                  @update:model-value="toggleTask(task._id, $event)"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label
                  :class="{ 'text-strike': task.status === 'completed' }"
                >
                  {{ task.title }}
                </q-item-label>
                <q-item-label caption>
                  {{ task.assignedTo?.firstName || "Unassigned" }} •
                  {{ task.dueDate ? formatDate(task.dueDate) : "No due date" }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge :color="taskStatusColor(task.status)">{{
                  task.status
                }}</q-badge>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="!tasks.length" class="text-center text-grey q-pa-lg">
            No tasks yet. Add one above.
          </div>
        </div>

        <!-- Payments Section -->
        <div class="glass-card q-mt-md">
          <div class="q-pa-md border-bottom">
            <div class="row items-center justify-between">
              <div class="text-h6 text-weight-bold">Payment History</div>
              <q-btn
                flat
                icon="add"
                label="Record Payment"
                @click="showAddPayment = true"
                color="positive"
              />
            </div>
          </div>

          <q-list separator>
            <q-item v-for="payment in sortedPayments" :key="payment._id">
              <q-item-section>
                <q-item-label
                  :class="{ 'text-strike text-grey-6': payment.voided }"
                >
                  ${{ payment.amount?.toLocaleString() }} - {{ payment.type }}
                  <q-badge
                    v-if="payment.voided"
                    color="negative"
                    class="q-ml-sm"
                    >VOIDED</q-badge
                  >
                </q-item-label>
                <q-item-label caption>
                  {{ payment.method }} • {{ formatDate(payment.date) }}
                  <span v-if="payment.recordedBy">
                    by {{ payment.recordedBy.firstName }}
                    {{ payment.recordedBy.lastName }}</span
                  >
                  <span v-if="payment.voided" class="text-negative">
                    • Voided: {{ payment.voidReason }}</span
                  >
                </q-item-label>
                <q-item-label
                  v-if="payment.notes"
                  caption
                  class="text-italic"
                  >{{ payment.notes }}</q-item-label
                >
              </q-item-section>

              <q-item-section side v-if="!payment.voided">
                <q-btn
                  flat
                  round
                  icon="edit"
                  size="sm"
                  @click="editPayment(payment)"
                  class="q-mr-xs"
                >
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  icon="block"
                  size="sm"
                  color="negative"
                  @click="voidPayment(payment)"
                >
                  <q-tooltip>Void</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>

           <div v-if="!payments.length" class="text-center text-grey q-pa-lg">
             No payments recorded yet.
           </div>
         </div>

<!-- Audit Trail -->
          <div class="glass-card q-mt-md">
            <audit-trail 
              :audit-logs="project.auditTrail || []" 
              @refresh="refreshAuditTrail"
              @user-click="showUserDetail"
            />
          </div>

          <!-- Attachments Section -->
          <div class="glass-card q-mt-md">
            <div class="q-pa-md border-bottom">
              <div class="row items-center justify-between">
                <div class="text-h6 text-weight-bold">Attachments</div>
                <q-btn flat icon="add" label="Upload" @click="showUploader = true" color="primary" />
              </div>
            </div>

            <q-list separator>
              <q-item v-for="attachment in attachments" :key="attachment._id" clickable v-ripple>
                <q-item-section avatar>
                  <q-icon :name="getAttachmentIcon(attachment.mimeType)" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ attachment.filename }}</q-item-label>
                  <q-item-label caption>
                    {{ attachment.type }} • {{ formatDate(attachment.uploadedAt) }} • {{ (attachment.size / 1024).toFixed(1) }} KB
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round icon="download" @click="downloadAttachment(attachment)" />
                </q-item-section>
              </q-item>
            </q-list>

            <div v-if="!attachments.length" class="text-center text-grey q-pa-lg">
              No attachments yet. Upload one above.
            </div>
          </div>
       </div>
     </div>

    <!-- Edit Payment Dialog -->
    <q-dialog v-model="showEditPayment" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Edit Payment</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model.number="editPaymentData.amount"
            label="Amount"
            type="number"
            prefix="$"
            outlined
            required
          />

          <q-select
            v-model="editPaymentData.type"
            :options="paymentTypeOptions"
            label="Payment Type"
            outlined
            emit-value
            map-options
            required
          />

          <q-select
            v-model="editPaymentData.method"
            :options="paymentMethodOptions"
            label="Payment Method"
            outlined
            emit-value
            map-options
            required
          />

          <q-input
            v-model="editPaymentData.notes"
            label="Notes"
            type="textarea"
            outlined
            autogrow
          />

          <q-input
            v-model="editPaymentData.correctionReason"
            label="Reason for Correction (required)"
            outlined
            required
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Save Changes"
            @click="savePaymentEdit"
            :loading="editing"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Void Payment Dialog -->
    <q-dialog v-model="showVoidPayment" persistent>
      <q-card style="min-width: 400px" class="glass-card">
        <q-card-section>
          <div class="text-h6 text-negative">
            <q-icon name="warning">Void Payment</q-icon>
          </div>
        </q-card-section>

        <q-card-section>
          <p>
            You are about to void a payment of
            <strong>${{ selectedPayment?.amount?.toLocaleString() }}</strong
            >.
          </p>
          <p class="text-grey-7">
            This will remove the payment from the total. A record will be kept
            for audit purposes.
          </p>

          <q-input
            v-model="voidReason"
            label="Reason for voiding (required)"
            outlined
            class="q-mt-md"
            required
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="negative"
            label="Void Payment"
            @click="confirmVoidPayment"
            :loading="voiding"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Note Dialog -->
    <q-dialog v-model="showAddNote" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Add Note</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="newNote"
            type="textarea"
            label="Note"
            outlined
            autogrow
            rows="3"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Add Note"
            @click="addNote"
            :loading="adding"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Task Dialog -->
    <q-dialog v-model="showAddTask" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Add Task</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="newTask.title"
            label="Task Title"
            outlined
            required
          />
          <q-input
            v-model="newTask.description"
            label="Description"
            type="textarea"
            outlined
            autogrow
          />

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-select
                v-model="newTask.assignedTo"
                :options="userStore.users"
                label="Assigned To"
                outlined
                option-value="_id"
                option-label="firstName"
                emit-value
              />
            </div>
            <div class="col-6">
              <q-input
                v-model="newTask.dueDate"
                label="Due Date"
                type="date"
                outlined
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Add Task"
            @click="addTask"
            :loading="adding"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Payment Dialog -->
    <q-dialog v-model="showAddPayment" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Record Payment</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model.number="newPayment.amount"
            label="Amount"
            type="number"
            prefix="$"
            outlined
            required
          />

          <q-select
            v-model="newPayment.type"
            :options="paymentTypeOptions"
            label="Payment Type"
            outlined
            emit-value
            map-options
            required
          />

          <q-select
            v-model="newPayment.method"
            :options="paymentMethodOptions"
            label="Payment Method"
            outlined
            emit-value
            map-options
            required
          />

          <q-input
            v-model="newPayment.notes"
            label="Notes"
            type="textarea"
            outlined
            autogrow
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="positive"
            label="Record Payment"
            @click="addPayment"
            :loading="adding"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Change Order Dialog -->
    <q-dialog v-model="showChangeOrder" persistent>
      <q-card style="min-width: 500px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Create Change Order</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="newChangeOrder.description"
            label="Description"
            type="textarea"
            outlined
            autogrow
            required
          />
          <q-input
            v-model="newChangeOrder.reason"
            label="Reason"
            outlined
            required
          />
          <q-input
            v-model.number="newChangeOrder.amount"
            label="Amount"
            type="number"
            prefix="$"
            outlined
            required
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="warning"
            label="Create Change Order"
            @click="createChangeOrder"
            :loading="adding"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Change Status Dialog -->
    <q-dialog v-model="showStatusChange" persistent>
      <q-card style="min-width: 400px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Change Project Status</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-select
            v-model="newStatus"
            :options="statusOptions"
            label="New Status"
            outlined
            emit-value
            map-options
            required
          />
          
          <q-input
            v-model="statusChangeReason"
            label="Reason for change (optional)"
            type="textarea"
            outlined
            autogrow
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Update Status"
            @click="updateStatus"
            :loading="updatingStatus"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- User Detail Modal -->
    <q-dialog v-model="showUserDetailModal">
      <q-card style="min-width: 400px; max-width: 500px" class="glass-card" v-if="selectedUser">
        <q-card-section class="text-center q-pt-lg">
          <user-avatar
            :user="selectedUser"
            size="xl"
            :clickable="false"
            :show-tooltip="false"
            class="q-mb-md"
          />
          
          <div class="text-h5 text-weight-bold">
            {{ selectedUser.firstName }} {{ selectedUser.lastName }}
          </div>
          
          <div class="text-caption text-grey-7 q-mb-sm" v-if="selectedUser.employeeId">
            {{ selectedUser.employeeId }}
          </div>
          
          <div class="q-mb-md">
            <q-badge
              v-for="role in selectedUser.roles"
              :key="role"
              :color="roleColor(role)"
              class="q-mr-xs"
            >
              {{ formatRole(role) }}
            </q-badge>
          </div>
        </q-card-section>

        <q-card-section>
          <q-list dense>
            <q-item v-if="selectedUser.email">
              <q-item-section avatar>
                <q-icon name="email" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ selectedUser.email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round icon="content_copy" size="sm" @click="copyText(selectedUser.email)" />
              </q-item-section>
            </q-item>
            
            <q-item v-if="selectedUser.phone">
              <q-item-section avatar>
                <q-icon name="phone" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ selectedUser.phone }}</q-item-label>
                <q-item-label v-if="selectedUser.phoneExtension" caption>ext. {{ selectedUser.phoneExtension }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round icon="content_copy" size="sm" @click="copyText(selectedUser.phone)" />
              </q-item-section>
            </q-item>
            
            <q-item v-if="selectedUser.department">
              <q-item-section avatar>
                <q-icon name="business" color="accent" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ selectedUser.department }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item v-if="selectedUser.marketId?.name || selectedUser.marketId?.code || selectedUser.marketId">
              <q-item-section avatar>
                <q-icon name="place" color="warning" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ selectedUser.marketId?.name || selectedUser.marketId?.code || 'Market ' + selectedUser.marketId }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedUser.employmentType">
              <q-item-section avatar>
                <q-icon name="work" color="info" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ formatEmploymentType(selectedUser.employmentType) }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedUser.commissionTier">
              <q-item-section avatar>
                <q-icon name="attach_money" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Commission Tier {{ selectedUser.commissionTier }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedUser.bio">
              <q-item-section>
                <q-item-label class="text-grey-7" style="white-space: pre-wrap">{{ selectedUser.bio }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Close" v-close-popup />
          <q-btn
            v-if="selectedUser._id !== authStore.user?._id"
            color="primary"
            icon="chat"
            label="Ping"
            @click="showUserDetailModal = false; $q.notify({type: 'info', message: 'Ping feature coming soon'})"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Commission Calculation Dialog -->
    <q-dialog v-model="showCommissionDialog" persistent>
      <q-card style="min-width: 450px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Calculate Commission</div>
          <div class="text-caption text-grey-7">
            Contract Amount: ${{ project.contractAmount?.toLocaleString() }}
          </div>
        </q-card-section>

        <q-card-section>
          <!-- Flat Rate Toggle -->
          <q-toggle
            v-model="useFlatRate"
            label="Use flat rate ($400) instead of percentage (10%)"
            color="primary"
          />

          <q-separator class="q-my-md" />

          <!-- Sales Rep Selection -->
          <div class="text-subtitle2 q-mb-sm">Select Sales Representatives *</div>
          
          <q-list dense>
            <q-item
              v-for="user in userStore.users.filter(u => u.roles?.includes('sales'))"
              :key="user._id"
              tag="label"
            >
              <q-item-section avatar>
                <q-checkbox
                  v-model="selectedSalesReps"
                  :val="user._id"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ user.firstName }} {{ user.lastName }}</q-item-label>
              </q-item-section>
              <q-item-section side v-if="selectedSalesReps.includes(user._id)">
                <q-input
                  v-model.number="commissionSplits[user._id]"
                  type="number"
                  suffix="%"
                  dense
                  outlined
                  style="width: 80px"
                  :rules="[val => val >= 0 && val <= 100 || '0-100']"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="selectedSalesReps.length > 0" class="q-mt-md">
            <div class="text-caption text-grey-7">
              Split Total: {{ selectedSalesReps.reduce((sum, id) => sum + (commissionSplits[id] || (100/selectedSalesReps.length)), 0) }}%
            </div>
            <div class="text-caption text-grey-7">
              {{ useFlatRate ? 'Flat Rate: $400' : 'Base: 10% of $' + project.contractAmount?.toLocaleString() }}
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup @click="selectedSalesReps = []; commissionSplits = {}" />
          <q-btn
            color="primary"
            label="Calculate"
            icon="calculate"
            @click="calculateCommission"
            :loading="calculating"
            :disable="selectedSalesReps.length === 0"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Assignment Dialog -->
    <q-dialog v-model="showAssignmentDialog" persistent>
      <q-card style="min-width: 400px" class="glass-card">
        <q-card-section>
          <div class="text-h6">Edit Assignment</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-select
            v-model="assignmentData.assignedSalesId"
            :options="userStore.users.filter(u => u.roles?.includes('sales'))"
            option-value="_id"
            :option-label="opt => opt ? `${opt.firstName} ${opt.lastName}` : ''"
            label="Sales Representative"
            outlined
            clearable
            emit-value
            map-options
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.firstName }} {{ scope.opt.lastName }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-model="assignmentData.bdcRepId"
            :options="userStore.users.filter(u => u.roles?.includes('bdc'))"
            option-value="_id"
            :option-label="opt => opt ? `${opt.firstName} ${opt.lastName}` : ''"
            label="BDC Representative"
            outlined
            clearable
            emit-value
            map-options
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.firstName }} {{ scope.opt.lastName }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>

<q-card-actions align="right">
           <q-btn flat label="Cancel" v-close-popup />
           <q-btn
             color="primary"
             label="Save"
             @click="saveAssignment"
             :loading="savingAssignment"
           />
         </q-card-actions>
       </q-card>
     </q-dialog>

     <!-- Upload File Dialog -->
     <q-dialog v-model="showUploader" persistent>
       <q-card class="glass-card" style="width: 500px">
         <q-card-section>
           <div class="text-h6">Upload File</div>
         </q-card-section>
         <q-card-section>
           <q-select
             v-model="uploadType"
             :options="attachmentTypeOptions"
             label="File Type"
             outlined
             class="q-mb-md"
           />
           <q-uploader
             :url="uploadUrl"
             method="POST"
             field-name="file"
             :headers="uploadHeaders"
             :form-fields="[{name: 'type', value: uploadType}]"
             :multiple="false"
             accept=".jpg, .png, .pdf"
             @uploaded="onFileUploaded"
             @rejected="onFileRejected"
           />
         </q-card-section>
         <q-card-actions align="right">
           <q-btn flat label="Cancel" v-close-popup />
         </q-card-actions>
       </q-card>
     </q-dialog>

    <email-composer
      v-model="showEmailComposer"
      :entityId="route.params.id"
      entityType="project"
      :recipient="project.customerId?.contacts?.[0]?.email"
    />
  </q-page>

  <!-- Loading State -->
  <q-page
    v-else-if="projectStore.isLoading"
    class="flex flex-center page-container"
  >
    <q-spinner size="50px" color="primary" />
    <div class="text-caption q-mt-md">Loading project...</div>
  </q-page>

  <!-- Error State -->
  <q-page v-else-if="error" class="flex flex-center page-container">
    <div class="text-center">
      <q-icon name="error" size="50px" color="negative" />
      <div class="text-h6 q-mt-md">Failed to load project</div>
      <div class="text-caption text-grey-7 q-mb-md">{{ error }}</div>
      <q-btn color="primary" label="Try Again" @click="retryFetch" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useProjectStore } from "@/stores/projects";
import { useUserStore } from "@/stores/users";
import { useAuthStore } from "@/stores/auth";
import UserAvatar from "@/components/UserAvatar.vue";
import AuditTrail from "@/components/AuditTrail.vue";
import EmailComposer from "@/components/EmailComposer.vue";
import {
  socket,
  connectSocket,
  joinProjectRoom,
  leaveProjectRoom,
} from "@/boot/socket";
import { api } from "@/boot/axios";
import { useQuasar } from "quasar";

const $q = useQuasar();
const route = useRoute();
const projectStore = useProjectStore();
const userStore = useUserStore();
const authStore = useAuthStore();

const loading = ref(false);
const adding = ref(false);
const updatingStatus = ref(false);
const error = ref<string | null>(null);

// Dialog states
const showAddNote = ref(false);
const showAddTask = ref(false);
const showAddPayment = ref(false);
const showChangeOrder = ref(false);
const showEditPayment = ref(false);
const showVoidPayment = ref(false);
const showStatusChange = ref(false);
const showCommissionDialog = ref(false);
const showAssignmentDialog = ref(false);
const showEmailComposer = ref(false);

// Assignment
const assignmentData = ref({
  assignedSalesId: "",
  bdcRepId: "",
});

// Commission calculation
const selectedSalesReps = ref<string[]>([]);
const commissionSplits = ref<Record<string, number>>({});
const useFlatRate = ref(false);

// Form data
const newNote = ref("");
const newTask = ref({
  title: "",
  description: "",
  assignedTo: "",
  dueDate: "",
});
const newPayment = ref({ amount: 0, type: "", method: "", notes: "" });
const newChangeOrder = ref({ description: "", reason: "", amount: 0 });

// Status change
const newStatus = ref("");
const statusChangeReason = ref("");

// Payment edit/void
const selectedPayment = ref<any>(null);
const editPaymentData = ref({
  amount: 0,
  type: "",
  method: "",
  notes: "",
  correctionReason: "",
});
const voidReason = ref("");
const editing = ref(false);
const voiding = ref(false);
const pnlData = ref(null);

const project = computed(() => projectStore.currentProject);
const activities = computed(() => project.value?.activities || []);
const tasks = computed(() => project.value?.tasks || []);
const payments = computed(() => project.value?.payments || []);

const sortedActivities = computed(() => {
  return [...activities.value].sort(
    (a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
});

const sortedPayments = computed(() => {
  // Sort by date descending, voided at bottom
  return [...payments.value].sort((a: any, b: any) => {
    if (a.voided && !b.voided) return 1;
    if (!a.voided && b.voided) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
});

const totalPaid = computed(
  () =>
    payments.value
      ?.filter((p: any) => !p.voided)
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0,
);

const balance = computed(
  () => (project.value?.contractAmount || 0) - totalPaid.value,
);

const paymentProgress = computed(() => {
  if (!project.value?.contractAmount || project.value.contractAmount === 0)
    return 0;
  // Exclude voided payments from progress calculation
  const paid =
    payments.value
      ?.filter((p: any) => !p.voided)
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
  return Math.min(paid / project.value.contractAmount, 1);
});

const paymentTypeOptions = [
  { label: "Deposit", value: "deposit" },
  { label: "Milestone", value: "milestone" },
  { label: "Monthly", value: "monthly" },
  { label: "Final", value: "final" },
];

const paymentMethodOptions = [
  { label: "Cash", value: "cash" },
  { label: "Check", value: "check" },
  { label: "Card", value: "card" },
  { label: "Financing", value: "financing" },
];

const formatStatus = (status: string) => {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    lead: "grey",
    qualified: "info",
    design_scheduled: "primary",
    contract_sent: "warning",
    contract_signed: "positive",
    production_scheduled: "accent",
    in_production: "secondary",
    completed: "positive",
    cancelled: "negative",
  };
  return colors[status] || "grey";
};

const taskStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "grey",
    in_progress: "warning",
    completed: "positive",
    cancelled: "negative",
  };
  return colors[status] || "grey";
};

const activityIcon = (type: string) => {
  const icons: Record<string, string> = {
    note: "chat",
    status_change: "sync",
    task_complete: "task_alt",
    payment: "payment",
    file_upload: "attach_file",
    call: "phone",
  };
  return icons[type] || "circle";
};

const activityColor = (type: string) => {
  const colors: Record<string, string> = {
    note: "primary",
    status_change: "secondary",
    task_complete: "info",
    payment: "positive",
    file_upload: "warning",
    call: "accent",
    email: "amber",
  };
  return colors[type] || "grey";
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatFullDate = (date: string) => {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatRelativeTime = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const refreshActivities = async () => {
  loading.value = true;
  error.value = null;
  try {
    await projectStore.fetchProject(route.params.id as string);
    await projectStore.fetchAuditTrail(route.params.id as string);
    if (!projectStore.currentProject) {
      error.value = "Project not found";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load project";
  } finally {
    loading.value = false;
  }
};

const retryFetch = async () => {
  error.value = null;
  await refreshActivities();
};

const refreshAuditTrail = async () => {
  try {
    await projectStore.fetchAuditTrail(route.params.id as string);
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to refresh audit trail' });
  }
};

const addNote = async () => {
  if (!newNote.value.trim()) return;

  adding.value = true;
  try {
    await projectStore.addActivity(route.params.id as string, {
      type: "note",
      content: newNote.value,
    });
    $q.notify({ type: "positive", message: "Note added" });
    newNote.value = "";
    showAddNote.value = false;
  } catch (error) {
    $q.notify({ type: "negative", message: "Failed to add note" });
  } finally {
    adding.value = false;
  }
};

const addTask = async () => {
  if (!newTask.value.title.trim()) return;

  adding.value = true;
  try {
    await projectStore.addTask(route.params.id as string, newTask.value);
    $q.notify({ type: "positive", message: "Task added" });
    newTask.value = { title: "", description: "", assignedTo: "", dueDate: "" };
    showAddTask.value = false;
  } catch (error) {
    $q.notify({ type: "negative", message: "Failed to add task" });
  } finally {
    adding.value = false;
  }
};

const toggleTask = async (taskId: string, completed: boolean) => {
  try {
    await projectStore.updateTaskStatus(
      route.params.id as string,
      taskId,
      completed ? "completed" : "pending",
    );
  } catch (error) {
    $q.notify({ type: "negative", message: "Failed to update task" });
  }
};

const addPayment = async () => {
  if (
    !newPayment.value.amount ||
    !newPayment.value.type ||
    !newPayment.value.method
  )
    return;

  adding.value = true;
  try {
    await projectStore.addPayment(route.params.id as string, newPayment.value);
    $q.notify({ type: "positive", message: "Payment recorded" });
    newPayment.value = { amount: 0, type: "", method: "", notes: "" };
    showAddPayment.value = false;
  } catch (error) {
    $q.notify({ type: "negative", message: "Failed to record payment" });
  } finally {
    adding.value = false;
  }
};

// Payment edit functions
const editPayment = (payment: any) => {
  selectedPayment.value = payment;
  editPaymentData.value = {
    amount: payment.amount,
    type: payment.type,
    method: payment.method,
    notes: payment.notes || "",
    correctionReason: "",
  };
  showEditPayment.value = true;
};

const savePaymentEdit = async () => {
  if (!editPaymentData.value.correctionReason.trim()) {
    $q.notify({
      type: "warning",
      message: "Please provide a reason for the correction",
    });
    return;
  }

  editing.value = true;
  try {
    await projectStore.updatePayment(
      route.params.id as string,
      selectedPayment.value._id,
      editPaymentData.value,
    );
    $q.notify({ type: "positive", message: "Payment updated" });
    showEditPayment.value = false;
    selectedPayment.value = null;
  } catch (error) {
    $q.notify({ type: "negative", message: "Failed to update payment" });
  } finally {
    editing.value = false;
  }
};

// Payment void functions
const voidPayment = (payment: any) => {
  selectedPayment.value = payment;
  voidReason.value = "";
  showVoidPayment.value = true;
};

const confirmVoidPayment = async () => {
  if (!voidReason.value.trim()) {
    $q.notify({
      type: "warning",
      message: "Please provide a reason for voiding",
    });
    return;
  }

  voiding.value = true;
  try {
    await projectStore.voidPayment(
      route.params.id as string,
      selectedPayment.value._id,
      voidReason.value,
    );
    $q.notify({ type: "positive", message: "Payment voided" });
    showVoidPayment.value = false;
    selectedPayment.value = null;
  } catch (error) {
    $q.notify({ type: "negative", message: "Failed to void payment" });
  } finally {
    voiding.value = false;
  }
};

// Commission functions
const calculating = ref(false);

const calculateCommission = async () => {
  if (selectedSalesReps.value.length === 0) {
    $q.notify({ type: "negative", message: "Please select at least one sales representative" });
    return;
  }

  calculating.value = true;
  try {
    const splitPercentages = selectedSalesReps.value.map(id => commissionSplits.value[id] || (100 / selectedSalesReps.value.length));
    
    const { data } = await api.post(`/projects/${route.params.id}/calculate-commission`, {
      salesRepIds: selectedSalesReps.value,
      splitPercentages,
      useFlatRate: useFlatRate.value,
    });
    
    $q.notify({ type: "positive", message: "Commission calculated successfully" });
    
    // Show calculated amounts
    const totalSales = data.salesReps?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;
    const bdcAmount = data.bdcAmount || 0;
    
    if (totalSales > 0 || bdcAmount > 0) {
      $q.notify({
        type: "info",
        message: `Sales: $${totalSales.toLocaleString()} | BDC: $${bdcAmount.toLocaleString()}`,
        timeout: 5000,
      });
    }
    
    // Refresh project to get updated commission data
    await projectStore.fetchProject(route.params.id as string);
    await projectStore.fetchAuditTrail(route.params.id as string);
    showCommissionDialog.value = false;
    selectedSalesReps.value = [];
    commissionSplits.value = {};
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to calculate commission";
    $q.notify({ type: "negative", message });
  } finally {
    calculating.value = false;
  }
};

const markCommissionPaid = async (type: "sales" | "bdc") => {
  try {
    await api.post(`/projects/${route.params.id}/commission/pay`, { type });
    $q.notify({ type: "positive", message: "Commission marked as paid" });
    await projectStore.fetchProject(route.params.id as string);
  } catch (error) {
    $q.notify({
      type: "negative",
      message: "Failed to mark commission as paid",
    });
  }
};

// Assignment functions
const savingAssignment = ref(false);

const showUploader = ref(false);
const uploadType = ref('other');

const attachmentTypeOptions = [
  { label: 'Contract', value: 'contract' },
  { label: 'Photo', value: 'photo' },
  { label: 'Other', value: 'other' },
];

const attachments = computed(() => project.value?.attachments || []);

const uploadUrl = computed(() => `${import.meta.env.VITE_API_URL}/projects/${route.params.id}/uploads`);

const uploadHeaders = computed(() => ([
  { name: 'Authorization', value: `Bearer ${authStore.token}` }
]));

const openAssignmentDialog = () => {
  // Initialize with current values
  assignmentData.value.assignedSalesId = project.value.assignedSalesId?._id || "";
  assignmentData.value.bdcRepId = project.value.commission?.bdcRepId?._id || "";
  showAssignmentDialog.value = true;
};

const saveAssignment = async () => {
  savingAssignment.value = true;
  try {
    const updateData: any = {};
    if (assignmentData.value.assignedSalesId) {
      updateData.assignedSalesId = assignmentData.value.assignedSalesId;
    }
    if (assignmentData.value.bdcRepId) {
      // bdcRepId is nested in commission object
      updateData.commission = {
        ...(project.value.commission || {}),
        bdcRepId: assignmentData.value.bdcRepId,
      };
    }
    
    await projectStore.updateProject(route.params.id as string, updateData);
    $q.notify({ type: "positive", message: "Assignments updated" });
    showAssignmentDialog.value = false;
  } catch (error) {
    $q.notify({ type: "negative", message: "Failed to update assignments" });
  } finally {
    savingAssignment.value = false;
  }
};

const createChangeOrder = async () => {
  if (!newChangeOrder.value.description || !newChangeOrder.value.reason) return;

  adding.value = true;
  try {
    // Call API directly since we need the route param
    await projectStore.addActivity(route.params.id as string, {
      type: "note",
      content: `Change Order: ${newChangeOrder.value.description} (${newChangeOrder.value.amount > 0 ? "+" : ""}$${newChangeOrder.value.amount})`,
    });
    $q.notify({ type: "positive", message: "Change order created" });
    newChangeOrder.value = { description: "", reason: "", amount: 0 };
    showChangeOrder.value = false;
  } catch (error) {
    $q.notify({ type: "negative", message: "Failed to create change order" });
  } finally {
    adding.value = false;
  }
};

// Status change
const statusOptions = [
  // Prospect
  { label: 'Lead', value: 'lead' },
  { label: 'Appointment', value: 'appointment' },
  { label: 'Rehash/Multitouch', value: 'rehash_multitouch' },
  { label: 'Contract Sent', value: 'contract_sent' },
  // Customer
  { label: 'Contract Signed', value: 'contract_signed' },
  { label: 'Initial Funding Cleared', value: 'funding_cleared' },
  { label: 'Deal Scrub - In Progress', value: 'deal_scrub_in_progress' },
  { label: 'Change Order Needed', value: 'change_order_needed' },
  { label: 'Deal Scrub - Complete', value: 'deal_scrub_complete' },
  // Production
  { label: 'Materials Ordered', value: 'materials_ordered' },
  { label: 'Materials Released', value: 'materials_released' },
  { label: 'Materials Received', value: 'materials_received' },
  // Install
  { label: 'Contacted for Install', value: 'install_contacted' },
  { label: 'Install In Progress', value: 'install_in_progress' },
  { label: 'Install Hung', value: 'install_hung' },
  { label: 'Install Complete - Service Needed', value: 'install_complete_service_needed' },
  { label: 'Install Complete', value: 'install_complete' },
  // Completed
  { label: 'Funding Received', value: 'funding_received' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const updateStatus = async () => {
  if (!newStatus.value || newStatus.value === project.value?.status) {
    showStatusChange.value = false;
    return;
  }

  updatingStatus.value = true;
  try {
    await projectStore.updateProject(route.params.id as string, {
      status: newStatus.value,
    });
    
    // Add activity note if reason provided
    if (statusChangeReason.value.trim()) {
      await projectStore.addActivity(route.params.id as string, {
        type: 'note',
        content: `Status change reason: ${statusChangeReason.value}`,
      });
    }
    
    $q.notify({ type: 'positive', message: 'Status updated' });
    newStatus.value = '';
    statusChangeReason.value = '';
    showStatusChange.value = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to update status' });
  } finally {
    updatingStatus.value = false;
  }
};

const onFileUploaded = (info) => {
  projectStore.fetchProject(route.params.id as string);
  showUploader.value = false;
  $q.notify({ type: 'positive', message: 'File uploaded successfully' });
};

const onFileRejected = () => {
  $q.notify({ type: 'negative', message: 'File rejected - only JPG, PNG, PDF allowed, max 5MB' });
};

const getAttachmentIcon = (mimeType: string) => {
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('pdf')) return 'picture_as_pdf';
  return 'attach_file';
};

const downloadAttachment = (attachment) => {
  $q.notify({ type: 'info', message: 'Download feature coming soon' });
};

// Socket event handlers
const handleActivityUpdate = (activity: any) => {
  if (project.value?.activities) {
    // Check if activity already exists (avoid duplicates)
    const exists = project.value.activities.some(
      (a: any) => a._id === activity._id,
    );
    if (!exists) {
      project.value.activities.push(activity);
      // Show subtle notification for real-time updates
      $q.notify({
        type: "info",
        message: "New activity added",
        position: "top-right",
        timeout: 2000,
        actions: [{ icon: "close", color: "white" }],
      });
    }
  }
};

const handleTaskUpdate = (payload: { action: string; task: any }) => {
  if (project.value?.tasks) {
    const index = project.value.tasks.findIndex(
      (t: any) => t._id === payload.task._id,
    );
    if (index > -1) {
      project.value.tasks[index] = payload.task;
    } else if (payload.action === "created") {
      project.value.tasks.push(payload.task);
    }
  }
};

const handlePaymentUpdate = (payload: {
  amount: number;
  totalPaid: number;
  percentPaid: number;
}) => {
  if (project.value) {
    // Refresh project data to get accurate state
    projectStore.fetchProject(route.params.id as string);
  }
};

const handleChangeOrderUpdate = (payload: {
  action: string;
  changeOrder: any;
}) => {
  if (project.value?.changeOrders) {
    const index = project.value.changeOrders.findIndex(
      (c: any) => c._id === payload.changeOrder._id,
    );
    if (index > -1) {
      project.value.changeOrders[index] = payload.changeOrder;
    } else if (payload.action === "created") {
      project.value.changeOrders.push(payload.changeOrder);
    }
  }
};

const handleCustomerUpdate = (payload: {
  projectId: string;
  customer: any;
}) => {
  // Update customer data in the current project
  if (project.value && project.value._id === payload.projectId) {
    project.value.customerId = payload.customer;
    $q.notify({
      type: "info",
      message: "Customer information updated",
      position: "top-right",
      timeout: 2000,
    });
  }
};

const handleProjectUpdate = (updatedProject: any) => {
  // Update the entire project when it changes (e.g., status change)
  if (project.value && project.value._id === updatedProject._id) {
    const oldStatus = project.value.status;
    Object.assign(project.value, updatedProject);
    
    // Notify if status changed
    if (oldStatus !== updatedProject.status) {
      $q.notify({
        type: "info",
        message: `Project status changed to ${formatStatus(updatedProject.status)}`,
        position: "top-right",
        timeout: 3000,
      });
    }
  }
};

onMounted(async () => {
  const projectId = route.params.id as string;
  error.value = null;

  try {
    await Promise.all([
      projectStore.fetchProject(projectId),
      userStore.fetchUsers(),
    ]);

    if (!projectStore.currentProject) {
      error.value = "Project not found";
    }

    // Fetch PnL if authorized
    if (authStore.user.roles.includes('admin') || authStore.user.roles.includes('manager')) {
      try {
        const { data } = await api.get(`/projects/${projectId}/pnl`);
        pnlData.value = data;
      } catch (err) {
        console.error('Failed to fetch PnL', err);
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load project";
  }

  // Connect socket and join project room
  connectSocket(authStore.token);
  joinProjectRoom(projectId);

  // Set up socket listeners for real-time updates
  socket.on("project:activity", handleActivityUpdate);
  socket.on("project:task", handleTaskUpdate);
  socket.on("project:payment", handlePaymentUpdate);
  socket.on("project:changeOrder", handleChangeOrderUpdate);
  socket.on("customer:updated", handleCustomerUpdate);
  socket.on("project:updated", handleProjectUpdate);
});

onUnmounted(() => {
  const projectId = route.params.id as string;

  // Clean up socket listeners
  socket.off("project:activity", handleActivityUpdate);
  socket.off("project:task", handleTaskUpdate);
  socket.off("project:payment", handlePaymentUpdate);
  socket.off("project:changeOrder", handleChangeOrderUpdate);
  socket.off("customer:updated", handleCustomerUpdate);
  socket.off("project:updated", handleProjectUpdate);

  leaveProjectRoom(projectId);
});

// Re-join room if project ID changes
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      if (oldId) leaveProjectRoom(oldId as string);
      if (newId) {
        joinProjectRoom(newId as string);
        projectStore.fetchProject(newId as string);
      }
    }
  },
);

const showUserDetailModal = ref(false);
const selectedUser = ref<any>(null);

const showUserDetail = async (user: any) => {
  if (user && (!user.phone || !user.department)) {
    try {
      const { data } = await api.get(`/users/${user._id || user}`);
      selectedUser.value = data;
    } catch (error) {
      selectedUser.value = user;
    }
  } else {
    selectedUser.value = user;
  }
  showUserDetailModal.value = true;
};

const formatRole = (role: string) => {
  const roles: Record<string, string> = {
    admin: "Admin",
    bdc: "BDC",
    sales: "Sales",
    warehouse: "Warehouse",
    production: "Production",
    contractor: "Contractor",
    manager: "Manager",
    installer: "Installer",
  };
  return roles[role] || role;
};

const roleColor = (role: string) => {
  const colors: Record<string, string> = {
    admin: "negative",
    bdc: "accent",
    sales: "primary",
    warehouse: "orange",
    production: "warning",
    contractor: "info",
    manager: "purple",
    installer: "teal",
  };
  return colors[role] || "grey";
};

const copyText = (text: string) => {
  navigator.clipboard.writeText(text);
  $q.notify({
    type: "positive",
    message: "Copied to clipboard",
    timeout: 1500,
  });
};

const formatEmploymentType = (type?: string) => {
  const types: Record<string, string> = {
    full_time: "Full Time",
    part_time: "Part Time",
    contractor: "Contractor",
    intern: "Intern",
  };
  return types[type || ""] || type || "Unknown";
};

const markSalesRepPaid = async (userId: string) => {
  try {
    await api.post(`/projects/${route.params.id}/commission/pay`, { 
      type: 'sales',
      userId 
    });
    $q.notify({ type: "positive", message: "Commission marked as paid" });
    await projectStore.fetchProject(route.params.id as string);
  } catch (error) {
    $q.notify({
      type: "negative",
      message: "Failed to mark commission as paid",
    });
  }
};
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.activity-list {
  max-height: 500px;
  overflow-y: auto;
}

.activity-item {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
}

.activity-note {
  border-left: 3px solid #9945ff;
}
.activity-status_change {
  border-left: 3px solid #14f195;
}
.activity-task_complete {
  border-left: 3px solid #31ccec;
}
.activity-payment {
  border-left: 3px solid #21ba45;
}
.activity-payment_correction {
  border-left: 3px solid #ff9800;
}
.activity-payment_voided {
  border-left: 3px solid #c10015;
}
.activity-call {
  border-left: 3px solid #f2c037;
}

.text-strike {
  text-decoration: line-through;
  opacity: 0.7;
}
</style>
