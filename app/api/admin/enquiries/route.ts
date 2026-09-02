import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getEnquiryModel, type EnquiryDocument } from "@/models/Enquiry";
import { adminEnquiryQuerySchema } from "@/lib/validations";
import { escapeRegex } from "@/lib/utils";
import type { EnquiryDTO } from "@/types/enquiry";


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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = adminEnquiryQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { q, status, page, limit } = parsed.data;

    await connectDB();
    const Enquiry = getEnquiryModel();

    const filter: Record<string, unknown> = {};

    if (q) {
      const safe = escapeRegex(q);
      filter.$or = [
        { fullName: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    const total = await Enquiry.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const docs = await Enquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const enquiries = docs.map((doc) =>
      toDTO(doc as unknown as EnquiryDocument & { _id: unknown }),
    );

    return NextResponse.json({
      success: true,
      data: { enquiries, total, page, totalPages },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}