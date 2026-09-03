export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        role="status"
        aria-label="Loading destinations"
        className="h-8 w-8 animate-pulse rounded-full bg-terra/30"
      />
    </div>
  );
}