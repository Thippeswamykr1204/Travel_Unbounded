import { NextRequest, NextResponse } from "next/server";
import { enquirySchema } from "@/lib/validations";
import { connectDB } from "@/lib/mongodb";
import { getEnquiryModel } from "@/models/Enquiry";
import { checkRateLimit } from "@/lib/rateLimit";

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: "Too many requests, try again shortly." },
      { status: 429 },
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

  // Honeypot check happens BEFORE schema validation: the schema itself
  // rejects a non-empty companyWebsite (max length 0), so checking after
  // validation would never let a tripped bot reach the fake-success path.
  const rawCompanyWebsite =
    body && typeof body === "object" && "companyWebsite" in body
      ? (body as { companyWebsite?: unknown }).companyWebsite
      : undefined;
  if (typeof rawCompanyWebsite === "string" && rawCompanyWebsite.length > 0) {
    return NextResponse.json(
      {
        success: true,
        id: "ok",
        message: "Enquiry submitted successfully",
      },
      { status: 201 },
    );
  }

  const parsed = enquirySchema.safeParse(body);
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

  try {
    await connectDB();
    const Enquiry = getEnquiryModel();
    // Mongoose ignores fields not declared on the schema (e.g. companyWebsite).
    const created = await Enquiry.create(parsed.data);

    return NextResponse.json(
      {
        success: true,
        id: created._id.toString(),
        message: "Enquiry submitted successfully",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key");
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    const Enquiry = getEnquiryModel();
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: enquiries.length,
      enquiries,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}