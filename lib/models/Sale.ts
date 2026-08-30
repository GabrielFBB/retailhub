import { Schema, model, models, Types } from "mongoose";

export type SaleDoc = {
  user: Types.ObjectId;
  product: Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
};

const SaleSchema = new Schema<SaleDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    // guardamos o nome e o sku no momento da venda: se o produto for
    // renomeado ou apagado, o historico mantem-se correto
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

SaleSchema.index({ user: 1, date: -1 });

export const Sale = models.Sale ?? model<SaleDoc>("Sale", SaleSchema);
