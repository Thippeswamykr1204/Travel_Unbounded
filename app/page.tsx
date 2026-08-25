import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import DestinationSection from "@/components/home/DestinationSection";
import WhyTravelUnbounded from "@/components/home/WhyTravelUnbounded";
import HowItStarts from "@/components/home/HowItStarts";
import CTASection from "@/components/home/CTASection";
import { destinations } from "@/data/destinations";

export const metadata: Metadata = {
  title: "Handpicked journeys across India and beyond",
  description:
    "Travel Unbounded plans a small number of trips a year, each one built around a single traveller's brief — from Kerala's backwaters to the Serengeti.",
};

export default function Home() {
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