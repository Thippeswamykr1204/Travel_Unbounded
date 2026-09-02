export default function TypingIndicator() {
  return (
    <div
      className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-sand/60 px-4 py-3"
      aria-hidden="true"
    >
      <span
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}