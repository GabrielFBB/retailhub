import mongoose, { Schema, model, models } from "mongoose";

export type ProductDoc = {
  name: string;
  price: number;
  stock: number;
  sku: string;
};

const ProductSchema = new Schema<ProductDoc>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const Product =
  models.Product ?? model<ProductDoc>("Product", ProductSchema);

