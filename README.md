# Travel Unbounded

A full-stack travel planning platform — visitors browse handpicked destinations, chat with an AI trip planner that generates real itineraries, and submit booking enquiries; a private admin dashboard manages enquiries, destinations, and analytics.

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and TypeScript
- **Tailwind CSS 4** for styling, with a custom design token theme
- **MongoDB** via **Mongoose** for data modeling and connection management
- **Zod** for schema validation, shared between client and server
- **React Hook Form** + **@hookform/resolvers** for form state and validation wiring
- **JWT + bcrypt** for admin authentication (`jsonwebtoken`, `bcryptjs`)
- **Google Gemini API** (`@google/generative-ai`) for the AI trip-planning chatbot
- **Recharts** for admin analytics charts
- **@react-pdf/renderer** for itinerary PDF export
- **Motion** (`motion`) for animation
- **Vitest**, **Testing Library** (`@testing-library/react`, `jest-dom`, `user-event`), and **jsdom** for testing
- **mongodb-memory-server** for isolated, in-memory database tests

## Features

### Public site

- Handpicked destination listings, pulled from MongoDB
- A validated, multi-field booking/enquiry form (`/contact`)
- An AI trip-planning chatbot (floating widget, available on every public page) that
  gathers a traveller's brief conversationally and hands back a structured, day-by-day
  itinerary
- Itinerary actions: enquire directly from a generated itinerary (prefills the booking
  form), copy the itinerary as plain text, and download it as a PDF

### Admin dashboard

- Authenticated login (JWT session cookie, bcrypt-hashed passwords)
- Enquiry CRM: search, filter, and update enquiry status
- Destination CMS: create, edit, and manage destination listings
- Analytics: enquiry volume over time, status breakdown, top destinations, and
  conversion rate, backed by real MongoDB aggregation pipelines and rendered with Recharts

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | Connection string for the MongoDB database (Atlas or local). Required for every route that touches the database. |
| `ADMIN_API_KEY` | Secret string required in the `x-admin-key` header to authorize `GET /api/enquiry`. |
| `NEXT_PUBLIC_SITE_URL` | Public base URL of the deployment, used by `app/robots.ts` and `app/sitemap.ts`. Falls back to `http://localhost:3000` if unset. |
| `GEMINI_API_KEY` | Server-side only, never exposed to the client. Powers the AI chat/itinerary endpoint. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). |
| `JWT_SECRET` | Server-side only. Signs and verifies the admin session JWT (`lib/auth.ts`). Use a long random string, e.g. `openssl rand -base64 48`. Never reuse across environments. |

The admin seed script (`npm run seed:admin`) additionally reads `ADMIN_SEED_EMAIL`,
`ADMIN_SEED_PASSWORD`, and `ADMIN_SEED_NAME` from the environment. These aren't in
`.env.example` since they're only needed once, locally, to create your own admin user —
set them in `.env.local` (or inline on the command) before running the script; see
**Admin Test Credentials** below.

## Local Setup

```bash
git clone <repo-url>
cd travel-unbounded
npm install
cp .env.example .env.local
# fill in MONGODB_URI, ADMIN_API_KEY, NEXT_PUBLIC_SITE_URL, GEMINI_API_KEY,
# and JWT_SECRET in .env.local

# also set ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD / ADMIN_SEED_NAME in .env.local,
# then seed your own admin user:
npm run seed:admin

# seed the destinations collection:
npm run seed:destinations

npm run dev
```

Visit `http://localhost:3000`.

## Admin Test Credentials

There is no hardcoded/shipped admin account. `npm run seed:admin` creates one from
whatever you set as `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` / `ADMIN_SEED_NAME` in your
own `.env.local` — use those same values to sign in at `/admin/login`.

## Testing

```bash
npm test              # Vitest + Testing Library suite
npm run build          # production build
npx tsc --noEmit        # type-check without emitting output
```

### E2E Tests

```bash
npm run test:e2e       # Playwright smoke tests (chromium)
```

Runs against a local dev server (started automatically). The admin login test needs
`ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` set in the environment running the tests —
without them it skips with a clear message rather than failing. Not covered: the AI
chatbot flow (requires a live `GEMINI_API_KEY` and calls to Google's API, which would
make the suite flaky/slow/costly in CI).

> **Note:** several test files use `mongodb-memory-server`, which downloads a MongoDB
> binary on first run. This requires network access the first time the suite runs
> (subsequent runs use the cached binary).

## Architectural Decisions & Trade-offs

- **JWT + bcrypt over NextAuth for admin auth** — the admin surface is a single internal
  role with no OAuth/social login requirement, so a hand-rolled JWT session cookie +
  bcrypt-hashed passwords keeps the dependency footprint small and the auth flow fully
  under our control, with no third-party app registration needed for evaluators to run
  the project locally.
- **Gemini over OpenAI for the chatbot** — Gemini's free tier is generous enough to
  develop and demo against without a billing setup, which matters for a project graders
  need to run themselves.
- **AI JSON output is never trusted directly** — the model is instructed to always
  respond with a single JSON object, but that instruction is a prompt, not a guarantee.
  The API route strips accidental markdown fences, attempts `JSON.parse`, and — critically
  — validates any itinerary payload against a Zod schema before it's ever sent to the
  client. Any parse failure or schema validation failure downgrades gracefully to a plain
  conversational fallback reply; a malformed itinerary can never reach the UI.
- **Destinations moved from static data to MongoDB** — Phase 1 used a static
  `data/destinations.ts` file; Phase 2's destination CMS requirement (create/edit
  listings from the admin dashboard) needed a real, persisted, queryable collection, so
  destinations were migrated into their own Mongoose model.
- **In-memory rate limiter** — `lib/rateLimit.ts` is a simple per-IP token bucket held in
  a module-level `Map`. It resets on cold start and isn't shared across serverless
  instances. That's a known, documented limitation rather than a bug — acceptable for
  this project's scale, and avoids pulling in an external rate-limiting service for a
  submission-scoped app.

## Deployment

1. Push the repository to GitHub.
2. Create a free MongoDB Atlas cluster and get a connection string.
3. Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
4. Import the repo into a new Vercel project.
5. Set `MONGODB_URI`, `ADMIN_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `GEMINI_API_KEY`, and
   `JWT_SECRET` as environment variables in the Vercel dashboard — these must be
   configured there separately from your local `.env.local`, which Vercel never reads.
6. Deploy, then run `npm run seed:admin` and `npm run seed:destinations` against the
   deployed database (locally, pointed at the production `MONGODB_URI`, or via a one-off
   script run) to create your admin user and seed destinations.

**Note on Atlas network access:** for simplicity this project assumes MongoDB Atlas
Network Access is opened to `0.0.0.0/0` (allow from anywhere), since Vercel serverless
functions don't have static outbound IPs on standard plans. This is a documented
tradeoff, not an oversight.

## Roadmap

- Customer accounts (save itineraries, view enquiry history)
- Richer destination detail pages (beyond listing cards)
- Weather and flight data integration alongside AI itineraries
- AI itinerary editing ("make day 4 lighter", "swap in more food-focused stops")
- Stricter Atlas network access (IP allowlisting) for production deployments
- Shared rate limiting across serverless instances (e.g. Redis-backed)

## Live Demo

Travel Unbounded: https://travel-unbounded-chi.vercel.app/