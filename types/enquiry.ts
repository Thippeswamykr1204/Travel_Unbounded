// Plain, serializable shapes for the admin UI + API layer.
// Do not duplicate the Mongoose schema here — see models/Enquiry.ts.

export type EnquiryStatus = "new" | "contacted" | "converted" | "closed";

export const STATUS_OPTIONS: EnquiryStatus[] = [
  "new",
  "contacted",
  "converted",
  "closed",
];

export type HotelCategory = "Standard" | "Deluxe" | "Luxury";

export interface EnquiryDTO {
  _id: string;
  fullName: string;
  countryCode: string;
  contactNumber: string;
  email: string;
  dateOfTravel: string;
  numberOfPeople: number;
  hotelCategory: HotelCategory;
  numberOfChildren: number;
  destination?: string;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
}