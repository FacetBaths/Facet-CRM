import mongoose, { Schema, Document, Types } from 'mongoose';

interface IAuditLog extends Document {
  entityType: string;
  entityId: Types.ObjectId;
  action: string;
  userId: Types.ObjectId;
  timestamp: Date;
  changes: Array<{ field: string; oldValue: any; newValue: any }>;
}

const AuditLogSchema = new Schema<IAuditLog>({
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true, refPath: 'entityType' },
  action: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
  changes: [{
    field: { type: String },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed }
  }]
}, { timestamps: true });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);