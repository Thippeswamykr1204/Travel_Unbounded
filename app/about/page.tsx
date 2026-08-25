import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import StorySection from "@/components/about/StorySection";
import OfficeLocations from "@/components/about/OfficeLocations";
import AboutWhyChoose from "@/components/about/AboutWhyChoose";
import CTASection from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "About Travel Unbounded",
  description:
    "Travel Unbounded was born from a simple belief — that the best journeys are built around the people taking them, not sold from a catalogue.",
};

export default function About() {
  return (
    <main>
      <section className="bg-canvas-deep pt-32 pb-14 sm:pt-40 sm:pb-20">
        <Container>
          <h1 className="font-display text-4xl text-paper sm:text-5xl">
            About Travel Unbounded
          </h1>
          <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-paper/75 sm:text-lg">
            A small team across three cities, building trips around the
            people taking them — not a catalogue.
          </p>
        </Container>
      </section>

      <StorySection />
      <OfficeLocations />
      <AboutWhyChoose />
      <CTASection />
    </main>
  );
}