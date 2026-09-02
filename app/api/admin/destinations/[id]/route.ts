import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getDestinationModel, type DestinationDocument } from "@/models/Destination";
import { destinationUpdateSchema } from "@/lib/validations";
import type { DestinationDTO } from "@/types/destination";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid destination id." },
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

    // Never trust a client-supplied slug.
    if (body && typeof body === "object" && "slug" in body) {
      delete (body as Record<string, unknown>).slug;
    }

    const parsed = destinationUpdateSchema.safeParse(body);
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

    const updated = await Destination.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Destination not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: toDTO(updated as unknown as DestinationDocument & { _id: unknown }),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid destination id." },
        { status: 400 },
      );
    }

    await connectDB();
    const Destination = getDestinationModel();

    const deleted = await Destination.findByIdAndDelete(id).lean();

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Destination not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}