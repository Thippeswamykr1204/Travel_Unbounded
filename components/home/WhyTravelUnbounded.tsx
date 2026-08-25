import Container from "@/components/ui/Container";

interface Reason {
  label: string;
  body: string;
}

const reasons: Reason[] = [
  {
    label: "Who answers",
    body: "Someone from Bangalore, Kochi, or Nairobi picks up — not a call center reading from a script.",
  },
  {
    label: "Who's been there",
    body: "Every route on this site has been walked, driven, or sailed by someone on the team, in the last two years.",
  },
  {
    label: "How it's priced",
    body: "One quote, all-in, before you book — no resort commissions padding the number you don't see.",
  },
  {
    label: "What happens if it rains",
    body: "A route built around you can bend around a washed-out road or a missed flight. A fixed departure can't.",
  },
];

export default function WhyTravelUnbounded() {
  return (
    <section className="bg-sand/50 py-14 sm:py-20">
      <Container>
        <div className="mb-8 max-w-2xl sm:mb-10">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            Why Travel Unbounded
          </h2>
        </div>

        {/* Mobile: snap-scroll strip. Desktop: static row. */}
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
          {reasons.map((reason) => (
            <div
              key={reason.label}
              className="flex w-[78%] flex-none snap-start flex-col gap-3 rounded-md bg-paper p-6 sm:w-[55%] lg:w-auto"
            >
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-terra">
                {reason.label}
              </span>
              <p className="font-sans text-base leading-relaxed text-ink/80">
                {reason.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}