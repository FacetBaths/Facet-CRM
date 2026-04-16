import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmail extends Document {
  subject: string;
  body: string;
  to: string[];
  from: string;
  cc?: string[];
  bcc?: string[];
  status: 'draft' | 'sent' | 'scheduled' | 'failed' | 'received';
  scheduledAt?: Date;
  sentAt?: Date;
  templateId?: Types.ObjectId;
  projectId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSchema = new Schema<IEmail>({
  subject: { type: String, required: true },
  body: { type: String, required: true },
  to: { type: [String], required: true },
  from: { type: String, required: true },
  cc: [String],
  bcc: [String],
  status: { type: String, enum: ['draft', 'sent', 'scheduled', 'failed'], default: 'draft' },
  scheduledAt: Date,
  sentAt: Date,
  templateId: { type: Schema.Types.ObjectId, ref: 'EmailTemplate' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Email = mongoose.model<IEmail>('Email', EmailSchema);

export interface IEmailTemplate extends Document {
  name: string;
  subject: string;
  html: string;
  placeholders: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>({
  name: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  html: { type: String, required: true },
  placeholders: [String],
}, { timestamps: true });

export const EmailTemplate = mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);