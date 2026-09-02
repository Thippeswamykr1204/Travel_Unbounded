import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getDestinationModel, type DestinationDocument } from "@/models/Destination";
import type { Destination } from "@/types/destination";

function toPublicShape(doc: DestinationDocument): Destination {
  return {
    id: doc.slug,
    name: doc.name,
    country: doc.country,
    category: doc.category,
    mood: doc.mood,
    image: doc.image,
    description: doc.description,
    price: doc.price,
    currency: doc.currency,
    duration: doc.duration,
  };
}

export async function GET() {
  try {
    await connectDB();
    const Destination = getDestinationModel();

    const docs = await Destination.find({ active: true })
      .sort({ category: 1, name: 1 })
      .lean();

    const data = docs.map((doc) =>
      toPublicShape(doc as unknown as DestinationDocument),
    );

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}