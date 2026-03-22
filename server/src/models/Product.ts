import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProductVariant {
  sku: string;
  description?: string;
  size?: string;
  costPrice: number;
  retailPrice: number;
  isActive: boolean;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  category: 'materials' | 'labor' | 'service' | 'package' | 'retail';
  type: 'physical' | 'service' | 'package';
  defaultVendorId?: Types.ObjectId;
  variants: IProductVariant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    sku: { type: String, required: true },
    description: { type: String },
    size: { type: String },
    costPrice: { type: Number, required: true, default: 0 },
    retailPrice: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: ['materials', 'labor', 'service', 'package', 'retail'],
      required: true,
    },
    type: {
      type: String,
      enum: ['physical', 'service', 'package'],
      required: true,
    },
    defaultVendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    variants: { type: [ProductVariantSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
