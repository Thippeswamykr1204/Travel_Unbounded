import mongoose, { Schema, type Document, type Model } from "mongoose";

export type AdminAuditAction =
  | "enquiry.status_updated"
  | "destination.created"
  | "destination.updated"
  | "destination.deleted";

export const ADMIN_AUDIT_ACTIONS: AdminAuditAction[] = [
  "enquiry.status_updated",
  "destination.created",
  "destination.updated",
  "destination.deleted",
];

export interface AdminAuditLogDocument extends Document {
  adminId: string;
  adminEmail: string;
  action: AdminAuditAction;
  targetId: string;
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

export const adminAuditLogSchema = new Schema<AdminAuditLogDocument>(
  {
    adminId: { type: String, required: true },
    adminEmail: { type: String, required: true },
    action: { type: String, enum: ADMIN_AUDIT_ACTIONS, required: true },
    targetId: { type: String, required: true },
    summary: { type: String, required: true },
  },
  { timestamps: true },
);

export function getAdminAuditLogModel(): Model<AdminAuditLogDocument> {
  return (
    (mongoose.models.AdminAuditLog as Model<AdminAuditLogDocument>) ||
    mongoose.model<AdminAuditLogDocument>("AdminAuditLog", adminAuditLogSchema)
  );
}