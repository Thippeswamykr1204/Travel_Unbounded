import Image from "next/image";
import Container from "@/components/ui/Container";

export default function StorySection() {
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="relative h-64 w-full overflow-hidden rounded-md sm:h-80 lg:h-[26rem] lg:w-1/2 lg:flex-none">
            <Image
              src="/images/destinations/ladakh.webp"
              alt="A quiet mountain road winding through Ladakh's high desert"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="lg:w-1/2">
            <p className="font-display text-2xl leading-snug text-ink sm:text-3xl">
              The best journeys aren&apos;t sold from a catalogue. They&apos;re
              built around the people taking them.
            </p>
            <div className="mt-6 space-y-4 font-sans text-base leading-relaxed text-ink/80">
              <p>
                Headquartered in Bangalore with offices in Kerala and
                Nairobi, we design trips that blend comfort, culture, and raw
                nature.
              </p>
              <p>
                Every destination, resort, and activity we recommend has been
                personally experienced by our team. From spotting the Big
                Five at dawn in the Masai Mara to cruising Ha Long Bay at
                sunset — we go where real stories are written, and we bring
                you along.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}