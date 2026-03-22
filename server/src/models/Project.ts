import mongoose, { Schema, Document, Types } from 'mongoose';

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
  type: 'note' | 'status_change' | 'task_complete' | 'payment' | 'file_upload' | 'call';
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
    type: { type: String, enum: ['note', 'status_change', 'task_complete', 'payment', 'file_upload', 'call'], required: true },
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

const ProjectSchema = new Schema<IProject>(
  {
    projectNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    type: { type: String, enum: ['renovation', 'service', 'warranty', 'retail'], required: true },
    parentProjectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    status: {
      type: String,
      enum: [
        'lead', 'qualified', 'design_scheduled', 'contract_sent', 'contract_signed',
        'rescission_period', 'materials_ordered', 'production_scheduled',
        'in_production', 'final_walkthrough', 'completed', 'cancelled'
      ],
      default: 'lead',
      index: true,
    },
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
    lineItems: { type: [ProjectLineItemSchema], default: [] },
    tasks: { type: [ProjectTaskSchema], default: [] },
    activities: { type: [ProjectActivitySchema], default: [] },
    changeOrders: { type: [ChangeOrderSchema], default: [] },
    paymentTerms: {
      type: { type: String, enum: ['standard', 'payment_plan'], default: 'standard' },
      total: { type: Number, default: 0 },
      milestones: { type: [PaymentScheduleMilestoneSchema], default: [] },
    },
    payments: { type: [ProjectPaymentSchema], default: [] },
    expenses: { type: [ProjectExpenseSchema], default: [] },
    materialsOrderedDate: { type: Date },
    productionStartDate: { type: Date },
    productionEndDate: { type: Date },
    estimatedCompletionDate: { type: Date },
    warrantyStartDate: { type: Date },
  },
  { timestamps: true }
);

// Indexes for common queries
ProjectSchema.index({ status: 1, assignedSalesId: 1 });
ProjectSchema.index({ customerId: 1, status: 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
