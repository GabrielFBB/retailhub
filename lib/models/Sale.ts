import mongoose, { Schema, model, models } from "mongoose";

export type SaleDoc = {
  date: string;
  total: number;
};

const SaleSchema = new Schema<SaleDoc>(
  {
    date: { type: String, required: true, unique: true },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const Sale = models.Sale ?? model<SaleDoc>("Sale", SaleSchema);
