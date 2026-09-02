import { connectDB } from "@/lib/mongodb";
import {
  getAdminAuditLogModel,
  type AdminAuditAction,
} from "@/models/AdminAuditLog";

export type { AdminAuditAction };

export async function recordAuditLog(entry: {
  adminId: string;
  adminEmail: string;
  action: AdminAuditAction;
  targetId: string;
  summary: string;
}): Promise<void> {
  try {
    await connectDB();
    const AdminAuditLog = getAdminAuditLogModel();
    await AdminAuditLog.create(entry);
  } catch (error) {
    console.error("Failed to record audit log entry:", error);
  }
}