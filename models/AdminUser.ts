import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface AdminUserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: "admin";
  createdAt: Date;
  updatedAt: Date;
}

export const adminUserSchema = new Schema<AdminUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
  },
  { timestamps: true },
);

export function getAdminUserModel(): Model<AdminUserDocument> {
  return (
    (mongoose.models.AdminUser as Model<AdminUserDocument>) ||
    mongoose.model<AdminUserDocument>("AdminUser", adminUserSchema)
  );
}