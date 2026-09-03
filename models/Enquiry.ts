import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface EnquiryDocument extends Document {
  fullName: string;
  countryCode: string;
  contactNumber: string;
  email: string;
  dateOfTravel: Date;
  numberOfPeople: number;
  hotelCategory: "Standard" | "Deluxe" | "Luxury";
  numberOfChildren: number;
  destination?: string;
  chatSessionId?: string;
  status: "new" | "contacted" | "converted" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

export const enquirySchema = new Schema<EnquiryDocument>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    countryCode: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    dateOfTravel: { type: Date, required: true },
    numberOfPeople: { type: Number, required: true, min: 1 },
    hotelCategory: {
      type: String,
      enum: ["Standard", "Deluxe", "Luxury"],
      required: true,
    },
    numberOfChildren: { type: Number, default: 0, min: 0 },
    destination: { type: String, required: false },
    chatSessionId: { type: String, required: false },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "closed"],
      default: "new",
    },
  },
  { timestamps: true },
);

export function getEnquiryModel(): Model<EnquiryDocument> {
  return (
    (mongoose.models.Enquiry as Model<EnquiryDocument>) ||
    mongoose.model<EnquiryDocument>("Enquiry", enquirySchema)
  );
}