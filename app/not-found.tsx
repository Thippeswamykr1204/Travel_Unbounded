import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-paper">
      <Container className="py-20 text-center sm:py-28">
        <p className="font-sans text-sm font-medium uppercase tracking-wide text-terra">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-ink/70">
          The page you&apos;re looking for doesn&apos;t exist or may have
          moved.
        </p>
        <div className="mt-8">
          <Button as="a" href="/">
            Back to home
          </Button>
        </div>
      </Container>
    </main>
  );
}