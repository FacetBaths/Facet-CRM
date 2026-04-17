import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICalendarEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  type: 'sales_appointment' | 'install_slot' | 'delivery' | 'other';
  projectId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  assignedUserIds: Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  location: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  source: 'crm_created' | 'imported';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['sales_appointment', 'install_slot', 'delivery', 'other'], required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    assignedUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
    },
    status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
    source: { type: String, enum: ['crm_created', 'imported'], default: 'crm_created' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes for queries and conflict detection
CalendarEventSchema.index({ assignedUserIds: 1, startTime: 1, endTime: 1 });
CalendarEventSchema.index({ projectId: 1, startTime: 1, endTime: 1 });
CalendarEventSchema.index({ startTime: 1, endTime: 1 });

export const CalendarEvent = mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);