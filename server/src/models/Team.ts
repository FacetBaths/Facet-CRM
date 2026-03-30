import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  type: 'sales' | 'production' | 'bdc' | 'warehouse' | 'installers' | 'custom';
  
  // Membership
  memberIds: Types.ObjectId[];
  leadId?: Types.ObjectId; // Team lead/manager
  
  // Market scope
  marketId?: Types.ObjectId; // Which market this team belongs to
  
  // Assignment rules
  autoAssignLeads: boolean; // Auto-assign new leads to this team
  assignmentStrategy: 'round_robin' | 'least_active' | 'manual';
  
  // Metrics
  goals?: {
    monthlyRevenue?: number;
    monthlyDeals?: number;
    startDate?: Date;
    endDate?: Date;
  };
  
  // Status
  isActive: boolean;
  
  // Audit
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GoalsSchema = new Schema({
  monthlyRevenue: { type: Number },
  monthlyDeals: { type: Number },
  startDate: { type: Date },
  endDate: { type: Date },
}, { _id: false });

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['sales', 'production', 'bdc', 'warehouse', 'installers', 'custom'],
      default: 'custom',
    },
    
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    leadId: { type: Schema.Types.ObjectId, ref: 'User' },
    
    marketId: { type: Schema.Types.ObjectId, ref: 'Market' },
    
    autoAssignLeads: { type: Boolean, default: false },
    assignmentStrategy: {
      type: String,
      enum: ['round_robin', 'least_active', 'manual'],
      default: 'manual',
    },
    
    goals: { type: GoalsSchema },
    
    isActive: { type: Boolean, default: true },
    
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

TeamSchema.index({ type: 1, marketId: 1 });
TeamSchema.index({ isActive: 1 });

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
