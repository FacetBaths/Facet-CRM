import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IContact {
  type: 'primary' | 'billing' | 'emergency';
  name: string;
  phone: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface ICustomer extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  contacts: IContact[];
  referralSource?: string;
  notes?: string;
  // Audit fields
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  // Current assigned sales rep
  assignedSalesId?: Types.ObjectId;
  auditLogs: Array<{
    action: string;
    userId: Types.ObjectId;
    timestamp: Date;
    changes: Array<{ field: string; oldValue: any; newValue: any }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    type: { type: String, enum: ['primary', 'billing', 'emergency'], required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
    },
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    contacts: { type: [ContactSchema], default: [] },
    referralSource: { type: String },
    notes: { type: String },
    // Audit fields
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    // Current assigned sales rep
    assignedSalesId: { type: Schema.Types.ObjectId, ref: 'User' },
    auditLogs: [{
      action: { type: String, required: true },
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      timestamp: { type: Date, default: Date.now },
      changes: [{
        field: { type: String },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed }
      }]
    }],
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
