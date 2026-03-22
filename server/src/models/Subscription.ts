import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubscriptionService {
  _id?: Types.ObjectId;
  type: 'holiday_lights' | 'gutter_cleaning' | 'window_washing' | 'power_washing' | 'deep_clean' | 'minor_repair';
  season?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface ISubscriptionPayment {
  _id?: Types.ObjectId;
  amount: number;
  date: Date;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  method: 'card' | 'ach' | 'cash';
  recordedBy?: Types.ObjectId;
}

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  plan: 'edge' | 'apex';
  status: 'active' | 'paused' | 'cancelled';
  
  // Billing
  billingFrequency: 'monthly' | 'annual';
  monthlyAmount: number;
  annualAmount: number;
  nextBillDate: Date;
  
  // Services
  services: ISubscriptionService[];
  
  // Payment history
  payments: ISubscriptionPayment[];
  
  // Benefits tracking
  warrantyExpiryDate?: Date;
  lastInspectionDate?: Date;
  nextInspectionDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionServiceSchema = new Schema<ISubscriptionService>(
  {
    type: {
      type: String,
      enum: ['holiday_lights', 'gutter_cleaning', 'window_washing', 'power_washing', 'deep_clean', 'minor_repair'],
      required: true,
    },
    season: { type: String },
    scheduledDate: { type: Date },
    completedDate: { type: Date },
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
    notes: { type: String },
  },
  { _id: true }
);

const SubscriptionPaymentSchema = new Schema<ISubscriptionPayment>(
  {
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    method: { type: String, enum: ['card', 'ach', 'cash'], required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    plan: { type: String, enum: ['edge', 'apex'], required: true },
    status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active' },
    billingFrequency: { type: String, enum: ['monthly', 'annual'], required: true },
    monthlyAmount: { type: Number, required: true }, // $49 or $89
    annualAmount: { type: Number, required: true }, // $499 or $899
    nextBillDate: { type: Date, required: true },
    services: { type: [SubscriptionServiceSchema], default: [] },
    payments: { type: [SubscriptionPaymentSchema], default: [] },
    warrantyExpiryDate: { type: Date },
    lastInspectionDate: { type: Date },
    nextInspectionDate: { type: Date },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ status: 1, nextBillDate: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
