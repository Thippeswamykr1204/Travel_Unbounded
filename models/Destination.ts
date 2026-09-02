import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface DestinationDocument extends Document {
  slug: string;
  name: string;
  country: string;
  category: "india" | "international";
  mood: string;
  image: string;
  description: string;
  price: number;
  currency: "INR";
  duration: string;
  active: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const destinationSchema = new Schema<DestinationDocument>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["india", "international"],
      required: true,
    },
    mood: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["INR"], default: "INR" },
    duration: { type: String, required: true },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export function getDestinationModel(): Model<DestinationDocument> {
  return (
    (mongoose.models.Destination as Model<DestinationDocument>) ||
    mongoose.model<DestinationDocument>("Destination", destinationSchema)
  );
}