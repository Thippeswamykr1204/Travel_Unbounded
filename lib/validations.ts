import { z } from "zod";

export const enquirySchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  countryCode: z.string().regex(/^\+\d{1,4}$/, "Select a country code"),
  contactNumber: z.string().regex(/^\d{6,14}$/, "Enter a valid phone number"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  dateOfTravel: z.coerce.date().refine((d) => d > new Date(), {
    message: "Travel date must be in the future",
  }),
  numberOfPeople: z.coerce.number().int().min(1, "At least 1 traveller"),
  hotelCategory: z.enum(["Standard", "Deluxe", "Luxury"]),
  numberOfChildren: z.coerce.number().int().min(0).default(0),
  destination: z.string().optional(),
  companyWebsite: z.string().max(0, "").optional(), // honeypot — must stay empty
});

export type EnquiryFormValues = z.infer<typeof enquirySchema>;