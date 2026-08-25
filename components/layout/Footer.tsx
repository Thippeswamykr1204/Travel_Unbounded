import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

const EXPLORE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

// NOTE: no office addresses were supplied in the project brief/data files
// available for this tier. These are clearly-marked placeholders — swap in
// the real street addresses before shipping.
const OFFICES = [
  {
    city: "Bengaluru HQ",
    address: "[Address not provided — placeholder, Bengaluru, Karnataka]",
  },
  {
    city: "Kochi",
    address: "[Address not provided — placeholder, Kochi, Kerala]",
  },
  {
    city: "Nairobi",
    address: "[Address not provided — placeholder, Nairobi, Kenya]",
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-sand bg-sand/40">
      <Container className="py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-ink">
              Travel Unbounded
            </span>
            <p className="mt-3 max-w-xs text-sm text-ink/70">
              Handpicked journeys across India and beyond, planned by people
              who&apos;ve actually been.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-horizon">
              Explore
            </h3>
            <ul className="mt-4 space-y-3">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink/80 transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-horizon">
              Offices
            </h3>
            <ul className="mt-4 space-y-4">
              {OFFICES.map((office) => (
                <li key={office.city} className="text-sm text-ink/80">
                  <p className="font-medium text-ink">{office.city}</p>
                  <p className="mt-0.5 text-ink/70">{office.address}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-start gap-4 sm:col-span-2 lg:col-span-1">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-horizon">
              Ready when you are
            </h3>
            <p className="text-sm text-ink/70">
              Tell us where you want to go — we&apos;ll handle the rest.
            </p>
            <Button as="a" href="/contact" variant="primary">
              Plan Your Trip
            </Button>
          </div>
        </div>

        <div className="mt-12 border-t border-moss/20 pt-6">
          <p className="text-xs text-ink/60">
            &copy; {year} Travel Unbounded. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}