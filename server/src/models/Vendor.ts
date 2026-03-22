import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVendor extends Document {
  _id: Types.ObjectId;
  name: string;
  type: 'supplier' | 'subcontractor' | 'utility' | 'other';
  taxId?: string;
  paymentTerms?: string;
  contacts: Array<{
    type: 'primary' | 'billing';
    name: string;
    phone: string;
    email?: string;
  }>;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['supplier', 'subcontractor', 'utility', 'other'],
      required: true,
    },
    taxId: { type: String },
    paymentTerms: { type: String },
    contacts: [
      {
        type: { type: String, enum: ['primary', 'billing'], required: true },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
      },
    ],
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
