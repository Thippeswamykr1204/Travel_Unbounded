import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminAuditLogModel } from "@/models/AdminAuditLog";
import type { AdminAuditAction } from "@/models/AdminAuditLog";

export type AuditLogEntryDTO = {
  _id: string;
  adminId: string;
  adminEmail: string;
  action: AdminAuditAction;
  targetId: string;
  summary: string;
  createdAt: string;
};

export async function GET() {
  try {
    await connectDB();
    const AdminAuditLog = getAdminAuditLogModel();

    const docs = await AdminAuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const data: AuditLogEntryDTO[] = docs.map((doc) => ({
      _id: String(doc._id),
      adminId: doc.adminId,
      adminEmail: doc.adminEmail,
      action: doc.action,
      targetId: doc.targetId,
      summary: doc.summary,
      createdAt: new Date(doc.createdAt).toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}