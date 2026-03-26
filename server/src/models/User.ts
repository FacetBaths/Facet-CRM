import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICommissionTier {
  threshold: number; // dollar amount
  rate: number; // percentage (e.g., 5 for 5%)
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'bdc' | 'sales' | 'design_consultant' | 'production' | 'contractor';
  isActive: boolean;
  phone?: string;
  // Commission settings - simple toggle-based
  commissionSettings?: {
    useFlatRate: boolean; // true = $400 flat, false = 10%
    isOwner: boolean; // for admin commission (3% vs 2%)
  };
  createdAt: Date;
  updatedAt: Date;
}

const CommissionSettingsSchema = new Schema({
  useFlatRate: { type: Boolean, default: false }, // true = $400 flat, false = 10%
  isOwner: { type: Boolean, default: false },
}, { _id: false });

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'bdc', 'sales', 'design_consultant', 'production', 'contractor'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    phone: { type: String },
    commissionSettings: { type: CommissionSettingsSchema },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
