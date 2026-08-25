import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import BookingForm from "@/components/contact/BookingForm";

export const metadata: Metadata = {
  title: "Plan Your Trip",
  description:
    "Tell us where, when, and how many — one of our travel experts will get back to you within 24 hours.",
};

type ContactPageProps = {
  searchParams: Promise<{ destination?: string }>;
};

export default async function Contact({ searchParams }: ContactPageProps) {
  const { destination } = await searchParams;

  return (
    <main>
      <section className="bg-canvas-deep pt-32 pb-14 sm:pt-40 sm:pb-20">
        <Container>
          <h1 className="font-display text-4xl text-paper sm:text-5xl">
            Plan Your Trip
          </h1>
          <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-paper/75 sm:text-lg">
            Tell us a little about the journey you have in mind — we&apos;ll
            take it from there.
          </p>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container className="max-w-2xl">
          <BookingForm destination={destination} />
        </Container>
      </section>
    </main>
  );
}