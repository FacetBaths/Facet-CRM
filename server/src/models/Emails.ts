import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
}

export interface IEmail extends Document {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments: IEmailAttachment[];
  receivedAt?: Date;
  sentAt?: Date;
  status: 'inbox' | 'sent' | 'draft';
  threadId?: string;
  labels?: string[];
  projectId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmailAttachmentSchema = new Schema<IEmailAttachment>(
  {
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    contentId: { type: String },
  },
  { _id: false }
);

const EmailSchema = new Schema<IEmail>(
  {
    from: { type: String, required: true },
    to: { type: [String], required: true },
    cc: { type: [String] },
    bcc: { type: [String] },
    subject: { type: String, required: true },
    bodyText: { type: String },
    bodyHtml: { type: String },
    attachments: { type: [EmailAttachmentSchema], default: [] },
    receivedAt: { type: Date },
    sentAt: { type: Date },
    status: { type: String, enum: ['inbox', 'sent', 'draft'], required: true },
    threadId: { type: String },
    labels: { type: [String] },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes
EmailSchema.index({ projectId: 1 });
EmailSchema.index({ customerId: 1 });
EmailSchema.index({ status: 1, receivedAt: -1 });

export const Email = mongoose.model<IEmail>('Email', EmailSchema);