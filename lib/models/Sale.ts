import { Schema, model, models, Types } from "mongoose";

export type SaleDoc = {
  user: Types.ObjectId;
  date: string;
  total: number;
};

const SaleSchema = new Schema<SaleDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

SaleSchema.index({ user: 1, date: 1 }, { unique: true });

export const Sale = models.Sale ?? model<SaleDoc>("Sale", SaleSchema);
