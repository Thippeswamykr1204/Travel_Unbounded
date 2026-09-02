import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getDestinationModel, type DestinationDocument } from "@/models/Destination";
import { destinationInputSchema } from "@/lib/validations";
import type { DestinationDTO } from "@/types/destination";
import { JWT_COOKIE_NAME, verifyAdminToken } from "@/lib/auth";
import { recordAuditLog } from "@/lib/auditLog";

function toDTO(doc: DestinationDocument & { _id: unknown }): DestinationDTO {
  return {
    id: doc.slug,
    _id: String(doc._id),
    name: doc.name,
    country: doc.country,
    category: doc.category,
    mood: doc.mood,
    image: doc.image,
    description: doc.description,
    price: doc.price,
    currency: doc.currency,
    duration: doc.duration,
    active: doc.active,
    featured: doc.featured,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(
  Destination: ReturnType<typeof getDestinationModel>,
  name: string,
): Promise<string> {
  const base = slugify(name) || "destination";
  let slug = base;
  let suffix = 1;

  while (await Destination.exists({ slug })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

export async function GET() {
  try {
    await connectDB();
    const Destination = getDestinationModel();

    const docs = await Destination.find({}).sort({ category: 1, name: 1 }).lean();
    const data = docs.map((doc) =>
      toDTO(doc as unknown as DestinationDocument & { _id: unknown }),
    );

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }

    const parsed = destinationInputSchema.safeParse(body);
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
    const Destination = getDestinationModel();

    const slug = await generateUniqueSlug(Destination, parsed.data.name);

    const created = await Destination.create({
      ...parsed.data,
      slug,
      currency: "INR",
    });

    const accessToken = request.cookies.get(JWT_COOKIE_NAME)?.value;
    const payload = accessToken ? verifyAdminToken(accessToken) : null;
    if (payload) {
      await recordAuditLog({
        adminId: payload.adminId,
        adminEmail: payload.email,
        action: "destination.created",
        targetId: String(created._id),
        summary: `Created destination "${created.name}"`,
      });
    }

    return NextResponse.json(
      { success: true, data: toDTO(created) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}