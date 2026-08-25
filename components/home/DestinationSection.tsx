import Container from "@/components/ui/Container";
import DestinationCard from "@/components/home/DestinationCard";
import Reveal from "@/components/motion/Reveal";
import type { Destination } from "@/types/destination";

interface DestinationSectionProps {
  title: string;
  subtitle: string;
  destinations: Destination[];
  variant: "india" | "international";
}

export default function DestinationSection({
  title,
  subtitle,
  destinations,
}: DestinationSectionProps) {
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div className="mb-8 max-w-2xl sm:mb-10">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            {title}
          </h2>
          <p className="mt-2 text-base text-ink/70">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {destinations.map((destination, index) => (
            <Reveal key={destination.id} index={index % 5} staggerMs={90}>
              <DestinationCard destination={destination} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}