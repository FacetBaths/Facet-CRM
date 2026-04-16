import { Schema, Document, Types, model } from 'mongoose';

export type UserRole = 'admin' | 'bdc' | 'sales' | 'warehouse' | 'production' | 'contractor' | 'manager' | 'installer';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'terminated';
export type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern';
export type Permission = 
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete'
  | 'projects.view_all' | 'projects.view_assigned' | 'projects.create' | 'projects.edit' | 'projects.delete'
  | 'customers.view_all' | 'customers.view_assigned' | 'customers.create' | 'customers.edit' | 'customers.delete'
  | 'commissions.view' | 'commissions.calculate' | 'commissions.approve'
  | 'reports.view' | 'reports.export'
  | 'calendar.view_all' | 'calendar.edit'
  | 'settings.view' | 'settings.edit'
  | 'admin.full_access';

export interface IUser extends Document {
  _id: Types.ObjectId;
  
  email: string;
  passwordHash: string;
  
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  phoneExtension?: string;
  
  employeeId?: string;
  employmentType: EmploymentType;
  status: UserStatus;
  hireDate?: Date;
  terminationDate?: Date;
  department?: string;
  
  roles: UserRole[];
  permissions?: Permission[];
  
  marketId?: Types.ObjectId;
  markets?: Types.ObjectId[];
  
  teamIds?: Types.ObjectId[];
  
  commissionTier?: number;
  commissionSettings?: {
    useFlatRate: boolean;
    isOwner: boolean;
  };
  
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    timezone: string;
    language: string;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      desktop: boolean;
    };
    dashboardLayout?: Record<string, any>;
  };
  
  lastLoginAt?: Date;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  passwordChangedAt?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PreferencesSchema = new Schema({
  theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
  timezone: { type: String, default: 'America/Chicago' },
  language: { type: String, default: 'en' },
  dateFormat: { type: String, enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], default: 'MM/DD/YYYY' },
  timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    desktop: { type: Boolean, default: true },
  },
  dashboardLayout: { type: Schema.Types.Mixed },
}, { _id: false });

const CommissionSettingsSchema = new Schema({
  useFlatRate: { type: Boolean, default: false },
  isOwner: { type: Boolean, default: false },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatar: { type: String },
  bio: { type: String },
  phone: { type: String },
  phoneExtension: { type: String },
  employeeId: { type: String, unique: true, sparse: true },
  employmentType: { 
    type: String, 
    enum: ['full_time', 'part_time', 'contractor', 'intern'],
    default: 'full_time'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'terminated'],
    default: 'active',
  },
  hireDate: { type: Date },
  terminationDate: { type: Date },
  department: { type: String },
  roles: {
    type: [String],
    enum: ['admin', 'bdc', 'sales', 'warehouse', 'production', 'contractor', 'manager', 'installer'],
    required: true,
    default: ['contractor'],
  },
  permissions: [{ type: String }],
  marketId: { type: Schema.Types.ObjectId, ref: 'Market' },
  markets: [{ type: Schema.Types.ObjectId, ref: 'Market' }],
  teamIds: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
  commissionTier: { type: Number, default: 1 },
  commissionSettings: { type: CommissionSettingsSchema },
  preferences: { type: PreferencesSchema, default: () => ({}) },
  lastLoginAt: { type: Date },
  lastLoginIp: { type: String },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },
  passwordChangedAt: { type: Date, default: Date.now },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
},
{ timestamps: true }
);

UserSchema.index({ status: 1, marketId: 1 });
UserSchema.index({ roles: 1 });
UserSchema.index({ teamIds: 1 });

UserSchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeId) {
    try {
      const { CompanySettings } = await import('./CompanySettings');
      const employeeId = await CompanySettings.generateEmployeeId(
        this.marketId ? this.marketId.toString() : '',
        this.roles[0] || 'contractor'
      );
      if (employeeId) {
        this.employeeId = employeeId;
      }
    } catch (error) {
      console.error('Failed to auto-generate employee ID:', error);
    }
  }
  next();
});

export function hasAnyRole(user: IUser, roles: UserRole[]): boolean {
  return roles.some(role => user.roles.includes(role));
}

export default model('User', UserSchema);