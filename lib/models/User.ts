import mongoose, { Schema, model, models } from "mongoose";

export type UserDoc = {
  email: string;
  passwordHash: string;
  name: string;
};

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const User = models.User ?? model<UserDoc>("User", UserSchema);
