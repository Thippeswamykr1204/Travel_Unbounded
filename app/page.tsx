import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import DestinationSection from "@/components/home/DestinationSection";
import WhyTravelUnbounded from "@/components/home/WhyTravelUnbounded";
import HowItStarts from "@/components/home/HowItStarts";
import CTASection from "@/components/home/CTASection";
import { connectDB } from "@/lib/mongodb";
import { getDestinationModel, type DestinationDocument } from "@/models/Destination";
import type { Destination } from "@/types/destination";

export const metadata: Metadata = {
  title: "Handpicked journeys across India and beyond",
  description:
    "Travel Unbounded plans a small number of trips a year, each one built around a single traveller's brief — from Kerala's backwaters to the Serengeti.",
};

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

export default async function Home() {
  await connectDB();
  const DestinationModel = getDestinationModel();

  const docs = await DestinationModel.find({ active: true })
    .sort({ category: 1, name: 1 })
    .lean();

  const destinations = docs.map((doc) =>
    toPublicShape(doc as unknown as DestinationDocument),
  );

  const indiaDestinations = destinations.filter((d) => d.category === "india");
  const internationalDestinations = destinations.filter(
    (d) => d.category === "international",
  );

  return (
    <main>
      <Hero />
      <DestinationSection
        title="India, unhurried"
        subtitle="Five ways to see the country slowly, from backwaters to high desert."
        destinations={indiaDestinations}
        variant="india"
      />
      <DestinationSection
        title="Further out"
        subtitle="Five journeys beyond the border, picked for what they don't compromise on."
        destinations={internationalDestinations}
        variant="international"
      />
      <WhyTravelUnbounded />
      <HowItStarts />
      <CTASection />
    </main>
  );
}