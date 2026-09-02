import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getEnquiryModel, type EnquiryDocument } from "@/models/Enquiry";
import { updateEnquiryStatusSchema } from "@/lib/validations";
import type { EnquiryDTO } from "@/types/enquiry";
import { JWT_COOKIE_NAME, verifyAdminToken } from "@/lib/auth";
import { recordAuditLog } from "@/lib/auditLog";

function toDTO(doc: EnquiryDocument & { _id: unknown }): EnquiryDTO {
  return {
    _id: String(doc._id),
    fullName: doc.fullName,
    countryCode: doc.countryCode,
    contactNumber: doc.contactNumber,
    email: doc.email,
    dateOfTravel: new Date(doc.dateOfTravel).toISOString(),
    numberOfPeople: doc.numberOfPeople,
    hotelCategory: doc.hotelCategory,
    numberOfChildren: doc.numberOfChildren,
    destination: doc.destination,
    status: doc.status,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid enquiry id." },
        { status: 400 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }

    const parsed = updateEnquiryStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check the submitted information.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    await connectDB();
    const Enquiry = getEnquiryModel();

    const updated = await Enquiry.findByIdAndUpdate(
      id,
      { status: parsed.data.status },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Enquiry not found." },
        { status: 404 },
      );
    }

    const responseData = {
      success: true,
      data: toDTO(updated as unknown as EnquiryDocument & { _id: unknown }),
    };

    const accessToken = request.cookies.get(JWT_COOKIE_NAME)?.value;
    const payload = accessToken ? verifyAdminToken(accessToken) : null;
    if (payload) {
      await recordAuditLog({
        adminId: payload.adminId,
        adminEmail: payload.email,
        action: "enquiry.status_updated",
        targetId: id,
        summary: `Updated status to "${parsed.data.status}"`,
      });
    }

    return NextResponse.json(responseData);
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}