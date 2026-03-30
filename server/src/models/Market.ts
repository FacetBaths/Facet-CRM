import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMarket extends Document {
  _id: Types.ObjectId;
  name: string; // e.g., "Illinois", "New England"
  code: string; // e.g., "IL", "NE"
  status: 'active' | 'inactive' | 'planning';
  
  // Location
  region: string; // e.g., "Midwest", "Northeast"
  timezone: string; // e.g., "America/Chicago"
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  
  // Contact
  phone: string;
  email: string;
  
  // Operations
  managerId?: Types.ObjectId; // Market manager
  operatingHours?: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  
  // Settings
  settings: {
    currency: string;
    dateFormat: string;
    defaultTaxRate: number;
  };
  
  // Branding
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  
  // Audit
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OperatingHoursSchema = new Schema({
  open: { type: String, default: '09:00' },
  close: { type: String, default: '17:00' },
}, { _id: false });

const MarketSchema = new Schema<IMarket>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'planning'],
      default: 'planning',
    },
    
    region: { type: String, required: true },
    timezone: { type: String, default: 'America/Chicago' },
    
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, default: 'USA' },
    },
    
    phone: { type: String },
    email: { type: String },
    
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
    operatingHours: {
      monday: { type: OperatingHoursSchema, default: () => ({}) },
      tuesday: { type: OperatingHoursSchema, default: () => ({}) },
      wednesday: { type: OperatingHoursSchema, default: () => ({}) },
      thursday: { type: OperatingHoursSchema, default: () => ({}) },
      friday: { type: OperatingHoursSchema, default: () => ({}) },
      saturday: { type: OperatingHoursSchema, default: () => ({}) },
      sunday: { type: OperatingHoursSchema, default: () => ({}) },
    },
    
    settings: {
      currency: { type: String, default: 'USD' },
      dateFormat: { type: String, default: 'MM/DD/YYYY' },
      defaultTaxRate: { type: Number, default: 0 },
    },
    
    branding: {
      logoUrl: { type: String },
      primaryColor: { type: String },
      secondaryColor: { type: String },
    },
    
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

MarketSchema.index({ status: 1 });
MarketSchema.index({ managerId: 1 });

export const Market = mongoose.model<IMarket>('Market', MarketSchema);
