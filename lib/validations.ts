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

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const ENQUIRY_STATUS_VALUES = ["new", "contacted", "converted", "closed"] as const;

export const adminEnquiryQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(ENQUIRY_STATUS_VALUES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type AdminEnquiryQuery = z.infer<typeof adminEnquiryQuerySchema>;

export const updateEnquiryStatusSchema = z.object({
  status: z.enum(ENQUIRY_STATUS_VALUES),
});

export type UpdateEnquiryStatusValues = z.infer<typeof updateEnquiryStatusSchema>;

export const destinationInputSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(100),
  country: z.string().trim().min(2, "Enter a country").max(100),
  category: z.enum(["india", "international"]),
  mood: z.string().trim().min(2, "Enter a mood").max(50),
  image: z.string().trim().url("Enter a valid image URL"),
  description: z.string().trim().min(10, "Enter a description"),
  price: z.coerce.number().positive("Price must be positive"),
  duration: z.string().trim().min(2, "Enter a duration"),
  active: z.coerce.boolean().optional().default(true),
});

export type DestinationInputValues = z.infer<typeof destinationInputSchema>;

export const destinationUpdateSchema = destinationInputSchema.partial();

export type DestinationUpdateValues = z.infer<typeof destinationUpdateSchema>;

export const analyticsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;