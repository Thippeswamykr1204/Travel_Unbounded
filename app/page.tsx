import DestinationSection from "@/components/home/DestinationSection";
import { destinations } from "@/data/destinations";

export default function Home() {
  const indiaDestinations = destinations.filter((d) => d.category === "india");
  const internationalDestinations = destinations.filter(
    (d) => d.category === "international",
  );

  return (
    <main>
      {/*
        Temporary render for Tier 2 component verification.
        Replaced by the real Hero-first home page in Tier 4.
      */}
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
    </main>
  );
}
