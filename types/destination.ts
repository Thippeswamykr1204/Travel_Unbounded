export type DestinationCategory = "india" | "international";

export interface Destination {
  id: string;
  name: string;
  country: string;
  category: DestinationCategory;
  mood: string;
  image: string;
  description: string;
  price: number;
  currency: "INR";
  duration: string;
}

export interface DestinationDTO {
  id: string;
  _id: string;
  name: string;
  country: string;
  category: DestinationCategory;
  mood: string;
  image: string;
  description: string;
  price: number;
  currency: "INR";
  duration: string;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_OPTIONS: { value: DestinationCategory; label: string }[] = [
  { value: "india", label: "India" },
  { value: "international", label: "International" },
];