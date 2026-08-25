import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="bg-canvas-deep py-10 sm:py-14">
      <Container>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="max-w-xl font-display text-3xl leading-tight text-paper sm:text-4xl">
            Tell us where, and we&apos;ll work out how.
          </h2>
          <Button as="a" href="/contact" variant="primary-inverse">
            Start planning
          </Button>
        </div>
      </Container>
    </section>
  );
}