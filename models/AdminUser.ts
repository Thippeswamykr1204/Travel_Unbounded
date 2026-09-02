import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface AdminUserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: "admin";
  failedLoginAttempts: number;
  lockedUntil?: Date | null;
  refreshTokenHash?: string | null;
  refreshTokenExpiresAt?: Date | null;
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
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    refreshTokenHash: { type: String, default: null },
    refreshTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export function getAdminUserModel(): Model<AdminUserDocument> {
  return (
    (mongoose.models.AdminUser as Model<AdminUserDocument>) ||
    mongoose.model<AdminUserDocument>("AdminUser", adminUserSchema)
  );
}