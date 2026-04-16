import { Schema, Document, Types, model } from 'mongoose';

export interface IProjectLineItem {
  _id?: Types.ObjectId;
  productId?: Types.ObjectId;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: 'materials' | 'labor' | 'service';
}

export interface IProjectTask {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  assignedTo?: Types.ObjectId;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completedAt?: Date;
  notes?: string;
}

export interface IProjectActivity {
  _id?: Types.ObjectId;
  type: 'note' | 'status_change' | 'task_complete' | 'payment' | 'payment_correction' | 'payment_voided' | 'file_upload' | 'call';
  userId?: Types.ObjectId;
  timestamp: Date;
  content: string;
  metadata?: Record<string, any>;
}

export interface IChangeOrder {
  _id?: Types.ObjectId;
  description: string;
  reason: string;
  amount: number;
  status: 'pending' | 'approved' | 'denied';
  requestedBy: Types.ObjectId;
  requestedAt: Date;
  respondedBy?: Types.ObjectId;
  respondedAt?: Date;
}

export interface IPaymentScheduleMilestone {
  percent: number;
  label: string;
  required: boolean;
  completed: boolean;
  trigger?: 'manual' | 'auto';
  schedule?: 'monthly';
  monthlyAmount?: number;
}

export interface IProjectPayment {
  _id?: Types.ObjectId;
  amount: number;
  date: Date;
  type: 'deposit' | 'milestone' | 'monthly' | 'final';
  method: 'cash' | 'check' | 'card' | 'financing';
  appliedToMilestone?: number;
  notes?: string;
  recordedBy: Types.ObjectId;
  // Correction/void fields
  updatedAt?: Date;
  updatedBy?: Types.ObjectId;
  voided?: boolean;
  voidedAt?: Date;
  voidedBy?: Types.ObjectId;
  voidReason?: string;
}

export interface IProjectExpense {
  _id?: Types.ObjectId;
  vendorId?: Types.ObjectId;
  description: string;
  amount: number;
  date: Date;
  category: 'materials' | 'labor' | 'permits' | 'equipment' | 'other';
  invoiced: boolean;
  paid: boolean;
  invoiceNumber?: string;
}

export interface IAuditLog {
  _id?: Types.ObjectId;
  timestamp: Date;
  userId: Types.ObjectId;
  action: string;
  changes: { field: string; oldValue: unknown; newValue: unknown }[];
  metadata?: Record<string, unknown>;
}

export interface IProject extends Document {
  _id: Types.ObjectId;
  projectNumber: string;
  customerId: Types.ObjectId;
  type: 'renovation' | 'service' | 'warranty' | 'retail';
  parentProjectId?: Types.ObjectId; // for service calls linked to original reno
  status: 'lead' | 'qualified' | 'design_scheduled' | 'contract_sent' | 'contract_signed' |
          'rescission_period' | 'materials_ordered' | 'production_scheduled' |
          'in_production' | 'final_walkthrough' | 'completed' | 'cancelled';

  // Project info
  title: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };

  // Sales
  assignedSalesId?: Types.ObjectId;
  source?: string;
  leadDate: Date;
  designAppointmentDate?: Date;
  contractDate?: Date;
  contractAmount: number;

  // Line items (snapshot)
  lineItems: IProjectLineItem[];

  // Workflow tasks
  tasks: IProjectTask[];

  // Activity feed
  activities: IProjectActivity[];

  // Change orders
  changeOrders: IChangeOrder[];

  // Payment terms
  paymentTerms: {
    type: 'standard' | 'payment_plan';
    total: number;
    milestones: IPaymentScheduleMilestone[];
  };

  // Commission tracking - supports split commissions and spiffs
  commission: {
    // Sales reps - can be split between multiple
    salesReps: {
      userId: Types.ObjectId;
      splitPercent: number; // e.g., 50 for 50/50
      amount: number;
      paid: boolean;
      paidDate?: Date;
    }[];
    // BDC (who set appointment)
    bdcRepId?: Types.ObjectId;
    bdcAmount: number;
    bdcPaid: boolean;
    bdcPaidDate?: Date;
    // Spiffs/bonuses - extra incentives
    spiffs: {
      description: string;
      amount: number;
      awardedTo: Types.ObjectId;
      paid: boolean;
      paidDate?: Date;
    }[];
    // Admin tracking
    adminPaid: boolean;
    adminPaidDate?: Date;
    calculatedAt?: Date;
    calcMethod?: 'flat' | 'percentage'; // how sales was calculated
  };

  // Actual payments
  payments: IProjectPayment[];

  // Expenses (for PnL)
  expenses: IProjectExpense[];

  // Production
  materialsOrderedDate?: Date;
  productionStartDate?: Date;
  productionEndDate?: Date;
  estimatedCompletionDate?: Date;

  // Warranty
  warrantyStartDate?: Date;

  // Audit fields
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  auditLogs: IAuditLog[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectLineItemSchema = new Schema<IProjectLineItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
    category: { type: String, enum: ['materials', 'labor', 'service'], required: true },
  },
  { _id: true }
);

const ProjectTaskSchema = new Schema<IProjectTask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
    completedAt: { type: Date },
    notes: { type: String },
  },
  { _id: true, timestamps: true }
);

const ProjectActivitySchema = new Schema<IProjectActivity>(
  {
    type: { type: String, enum: ['note', 'status_change', 'task_complete', 'payment', 'payment_correction', 'payment_voided', 'file_upload', 'call'], required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    content: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: true }
);

const ChangeOrderSchema = new Schema<IChangeOrder>(
  {
    description: { type: String, required: true },
    reason: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestedAt: { type: Date, default: Date.now },
    respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
  },
  { _id: true }
);

const PaymentScheduleMilestoneSchema = new Schema<IPaymentScheduleMilestone>(
  {
    percent: { type: Number, required: true },
    label: { type: String, required: true },
    required: { type: Boolean, default: true },
    completed: { type: Boolean, default: false },
    trigger: { type: String, enum: ['manual', 'auto'] },
    schedule: { type: String, enum: ['monthly'] },
    monthlyAmount: { type: Number },
  },
  { _id: false }
);

const ProjectPaymentSchema = new Schema<IProjectPayment>(
  {
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['deposit', 'milestone', 'monthly', 'final'], required: true },
    method: { type: String, enum: ['cash', 'check', 'card', 'financing'], required: true },
    appliedToMilestone: { type: Number },
    notes: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Correction tracking
    updatedAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    voided: { type: Boolean, default: false },
    voidedAt: { type: Date },
    voidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    voidReason: { type: String },
  },
  { _id: true }
);

const ProjectExpenseSchema = new Schema<IProjectExpense>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    category: { type: String, enum: ['materials', 'labor', 'permits', 'equipment', 'other'], required: true },
    invoiced: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    invoiceNumber: { type: String },
  },
  { _id: true }
);

const CommissionSchema = new Schema({
  // Sales reps - supports split commissions
  salesReps: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    splitPercent: { type: Number, default: 100 }, // 50 for 50/50 split
    amount: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paidDate: { type: Date },
  }],
  // BDC rep
  bdcRepId: { type: Schema.Types.ObjectId, ref: 'User' },
  bdcAmount: { type: Number, default: 0 },
  bdcPaid: { type: Boolean, default: false },
  bdcPaidDate: { type: Date },
  // Spiffs/bonuses
  spiffs: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    awardedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paid: { type: Boolean, default: false },
    paidDate: { type: Date },
  }],
  // Admin tracking
  adminPaid: { type: Boolean, default: false },
  adminPaidDate: { type: Date },
  calculatedAt: { type: Date },
  calcMethod: { type: String, enum: ['flat', 'percentage'] },
}, { _id: false });

const AuditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    changes: [{
      field: { type: String, required: true },
      oldValue: { type: Schema.Types.Mixed },
      newValue: { type: Schema.Types.Mixed },
    }],
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: true }
);

const ProjectSchema = new Schema<IProject>({
  projectNumber: { type: String, unique: true, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { type: String, enum: ['renovation', 'service', 'warranty', 'retail'], required: true },
  parentProjectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  status: { type: String, enum: ['lead', 'qualified', 'design_scheduled', 'contract_sent', 'contract_signed', 'rescission_period', 'materials_ordered', 'production_scheduled', 'in_production', 'final_walkthrough', 'completed', 'cancelled'], default: 'lead' },
  title: { type: String, required: true },
  description: { type: String },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
  },
  assignedSalesId: { type: Schema.Types.ObjectId, ref: 'User' },
  source: { type: String },
  leadDate: { type: Date, default: Date.now },
  designAppointmentDate: { type: Date },
  contractDate: { type: Date },
  contractAmount: { type: Number, default: 0 },
  lineItems: [ProjectLineItemSchema],
  tasks: [ProjectTaskSchema],
  activities: [ProjectActivitySchema],
  changeOrders: [ChangeOrderSchema],
  paymentTerms: {
    type: { type: String, enum: ['standard', 'payment_plan'], default: 'standard' },
    total: { type: Number, default: 0 },
    milestones: [PaymentScheduleMilestoneSchema],
  },
  commission: CommissionSchema,
  payments: [ProjectPaymentSchema],
  expenses: [ProjectExpenseSchema],
  materialsOrderedDate: { type: Date },
  productionStartDate: { type: Date },
  productionEndDate: { type: Date },
  estimatedCompletionDate: { type: Date },
  warrantyStartDate: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  auditLogs: [AuditLogSchema],
}, { timestamps: true });

ProjectSchema.index({ status: 1, assignedSalesId: 1 });
ProjectSchema.index({ customerId: 1, status: 1 });

export default model<IProject>('Project', ProjectSchema);