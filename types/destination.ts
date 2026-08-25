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
