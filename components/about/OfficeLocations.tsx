import Container from "@/components/ui/Container";
import { OFFICES } from "@/data/offices";

export default function OfficeLocations() {
  return (
    <section className="bg-sand/50 py-14 sm:py-20">
      <Container>
        <div className="mb-8 max-w-2xl sm:mb-10">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            Where you&apos;ll find us
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {OFFICES.map((office) => (
            <div
              key={office.city}
              className="flex flex-col gap-3 rounded-md bg-paper p-6"
            >
              <h3 className="font-display text-lg text-ink">{office.city}</h3>
              <p className="font-sans text-sm leading-relaxed text-ink/70">
                {office.address}
              </p>
              <p className="mt-auto font-mono text-xs uppercase tracking-[0.12em] text-terra">
                {office.note}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}