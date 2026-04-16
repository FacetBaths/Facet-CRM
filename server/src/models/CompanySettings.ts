import mongoose, { Schema, Document, Model, Types } from 'mongoose';

interface ICompanySettingsModel extends Model<ICompanySettings> {
  getSettings(): Promise<ICompanySettings & Document>;
  generateEmployeeId(marketId: string, role: string): Promise<string | null>;
}

// Company-wide configuration
export interface ICompanySettings extends Document {
  _id: Types.ObjectId;
  
  // Company Info
  name: string;
  legalName?: string;
  taxId?: string;
  website?: string;
  
  // Global settings
  settings: {
    defaultTimezone: string;
    defaultCurrency: string;
    defaultDateFormat: string;
    defaultLanguage: string;
  };
  
  // Employee ID generation
  employeeIdConfig: {
    enabled: boolean;
    format: string; // e.g., "{MARKET}-{ROLE}{SEQUENCE:4}"
    roleCodes: Map<string, string>; // { admin: 'FRA', sales: 'FRS', bdc: 'FRB', ... }
    marketCodes: Map<string, string>; // { marketId: 'IL', marketId: 'NE', ... }
    lastSequence: Map<string, number>; // { 'IL-FRA': 1, 'NE-FRT': 5, ... }
  };
  
  // Branding
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    faviconUrl?: string;
  };
  
  // Audit
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    name: { type: String, required: true, default: 'Facet Renovations' },
    legalName: { type: String },
    taxId: { type: String },
    website: { type: String },
    
    settings: {
      defaultTimezone: { type: String, default: 'America/Chicago' },
      defaultCurrency: { type: String, default: 'USD' },
      defaultDateFormat: { type: String, default: 'MM/DD/YYYY' },
      defaultLanguage: { type: String, default: 'en' },
    },
    
    employeeIdConfig: {
      enabled: { type: Boolean, default: true },
      format: { type: String, default: '{MARKET}-{ROLE}{SEQUENCE:4}' },
      roleCodes: { type: Map, of: String, default: () => new Map([
        ['admin', 'FRA'],
        ['manager', 'FRM'],
        ['sales', 'FRS'],
        ['bdc', 'FRB'],
        ['warehouse', 'FRW'],
        ['production', 'FRP'],
        ['installer', 'FRI'],
        ['contractor', 'FRC'],
      ]) },
      marketCodes: { type: Map, of: String, default: () => new Map() },
      lastSequence: { type: Map, of: Number, default: () => new Map() },
    },
    
    branding: {
      logoUrl: { type: String },
      primaryColor: { type: String, default: '#1976d2' },
      secondaryColor: { type: String, default: '#26a69a' },
      faviconUrl: { type: String },
    },
    
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

// Singleton - only one settings document
CompanySettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Generate next employee ID
CompanySettingsSchema.statics.generateEmployeeId = async function(
  marketId: string,
  role: string
): Promise<string | null> {
  const settings = await (this as unknown as ICompanySettingsModel).getSettings();
  
  if (!settings.employeeIdConfig.enabled) {
    return null;
  }
  
  const marketCode = settings.employeeIdConfig.marketCodes.get(marketId) || 'XX';
  const roleCode = settings.employeeIdConfig.roleCodes.get(role) || 'FRT';
  
  const key = `${marketCode}-${roleCode}`;
  const currentSequence = settings.employeeIdConfig.lastSequence.get(key) || 0;
  const nextSequence = currentSequence + 1;
  
  // Update sequence
  settings.employeeIdConfig.lastSequence.set(key, nextSequence);
  await settings.save();
  
  // Format: {MARKET}-{ROLE}{SEQUENCE:4} -> IL-FRA0001
  const sequenceStr = nextSequence.toString().padStart(4, '0');
  return `${marketCode}-${roleCode}${sequenceStr}`;
};

export const CompanySettings = mongoose.model<ICompanySettings, ICompanySettingsModel>('CompanySettings', CompanySettingsSchema);
