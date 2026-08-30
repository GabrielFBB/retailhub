import { Schema, model, models, Types } from "mongoose";

export type ProductDoc = {
  user: Types.ObjectId;
  name: string;
  price: number;
  stock: number;
  sku: string;
};

const ProductSchema = new Schema<ProductDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true },
  },
  { timestamps: true }
);

ProductSchema.index({ user: 1, sku: 1 }, { unique: true });

export const Product =
  models.Product ?? model<ProductDoc>("Product", ProductSchema);
