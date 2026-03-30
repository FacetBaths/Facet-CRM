import mongoose, { Schema, Document, Types } from 'mongoose';

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
  
  // Authentication
  email: string;
  passwordHash: string;
  
  // Profile
  firstName: string;
  lastName: string;
  avatar?: string; // URL to avatar image
  bio?: string;
  phone?: string;
  phoneExtension?: string;
  
  // Employment
  employeeId?: string;
  employmentType: EmploymentType;
  status: UserStatus;
  hireDate?: Date;
  terminationDate?: Date;
  department?: string;
  
  // Roles & Permissions
  roles: UserRole[];
  permissions?: Permission[]; // Granular permissions beyond roles
  
  // Market/Region
  marketId?: Types.ObjectId; // Which market they're assigned to
  markets?: Types.ObjectId[]; // Markets they have access to (for multi-market managers)
  
  // Teams
  teamIds?: Types.ObjectId[]; // Teams/groups they belong to
  
  // Commission
  commissionTier?: number; // 1, 2, 3 for different rates
  commissionSettings?: {
    useFlatRate: boolean;
    isOwner: boolean;
  };
  
  // Preferences
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
    dashboardLayout?: Record<string, any>; // Customizable dashboard
  };
  
  // Security
  lastLoginAt?: Date;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  passwordChangedAt?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  
  // Audit
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

const UserSchema = new Schema<IUser>(
  {
    // Authentication
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    
    // Profile
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: { type: String },
    bio: { type: String },
    phone: { type: String },
    phoneExtension: { type: String },
    
    // Employment
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
    
    // Roles & Permissions
    roles: {
      type: [String],
      enum: ['admin', 'bdc', 'sales', 'warehouse', 'production', 'contractor', 'manager', 'installer'],
      required: true,
      default: ['contractor'],
    },
    permissions: [{ type: String }],
    
    // Market/Region
    marketId: { type: Schema.Types.ObjectId, ref: 'Market' },
    markets: [{ type: Schema.Types.ObjectId, ref: 'Market' }],
    
    // Teams
    teamIds: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    
    // Commission
    commissionTier: { type: Number, default: 1 },
    commissionSettings: { type: CommissionSettingsSchema },
    
    // Preferences
    preferences: { type: PreferencesSchema, default: () => ({}) },
    
    // Security
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    passwordChangedAt: { type: Date, default: Date.now },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    
    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes for performance
UserSchema.index({ status: 1, marketId: 1 });
UserSchema.index({ roles: 1 });
UserSchema.index({ teamIds: 1 });

// Pre-save hook to auto-generate employee ID
UserSchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeId) {
    try {
      const { CompanySettings } = await import('./CompanySettings');
      const employeeId = await CompanySettings.generateEmployeeId(
        this.marketId?.toString() || '',
        this.roles[0] || 'contractor'
      );
      if (employeeId) {
        this.employeeId = employeeId;
      }
    } catch (error) {
      console.error('Failed to auto-generate employee ID:', error);
      // Don't fail user creation if ID generation fails
    }
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);

// Helper function to check if user has a specific role
export const hasRole = (user: IUser, role: UserRole): boolean => {
  return user.roles?.includes(role) || false;
};

// Helper function to check if user has any of the given roles
export const hasAnyRole = (user: IUser, roles: UserRole[]): boolean => {
  if (!user.roles) return false;
  return roles.some(role => user.roles.includes(role));
};

// Helper function to check if user has all given roles
export const hasAllRoles = (user: IUser, roles: UserRole[]): boolean => {
  if (!user.roles) return false;
  return roles.every(role => user.roles.includes(role));
};

// Helper function to check if user has a specific permission
export const hasPermission = (user: IUser, permission: Permission): boolean => {
  // Admins have all permissions
  if (user.roles?.includes('admin')) return true;
  // Check explicit permissions
  return user.permissions?.includes(permission) || false;
};

// Helper function to check if user has any of the given permissions
export const hasAnyPermission = (user: IUser, permissions: Permission[]): boolean => {
  if (user.roles?.includes('admin')) return true;
  if (!user.permissions) return false;
  return permissions.some(p => user.permissions?.includes(p));
};

// Helper function to check if user can access a specific market
export const canAccessMarket = (user: IUser, marketId: string): boolean => {
  if (user.roles?.includes('admin')) return true;
  if (user.marketId?.toString() === marketId) return true;
  return user.markets?.some(m => m.toString() === marketId) || false;
};

// Helper to get full display name
export const getFullName = (user: IUser): string => {
  return `${user.firstName} ${user.lastName}`;
};

// Helper to get initials
export const getInitials = (user: IUser): string => {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
};
