# Travel Unbounded

## Overview

Travel Unbounded is a full-stack travel enquiry platform built with Next.js. Visitors browse featured destinations and submit a booking enquiry through a validated multi-field form; enquiries are persisted to MongoDB and can be reviewed through a bonus admin-only API endpoint.

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and TypeScript
- **Tailwind CSS 4** for styling, with a custom design token theme
- **Motion** (`motion`) for animation
- **React Hook Form** + **@hookform/resolvers** for form state and validation wiring
- **Zod** for schema validation, shared between client and server
- **Mongoose** for MongoDB modeling and connection management
- **Vitest**, **Testing Library** (`@testing-library/react`, `jest-dom`, `user-event`), and **jsdom** for testing
- **mongodb-memory-server** for isolated, in-memory database tests

## Architecture

- Built on the **Next.js App Router**, with pages under `app/` (`/`, `/about`, `/contact`) and a REST-style API route at `app/api/enquiry/route.ts`.
- Components are split between **Server Components** (default, for static/content sections like destination and office data) and **Client Components** (interactive pieces — the booking form, mobile menu, motion-driven reveals — marked with `"use client"`).
- The API route handles both form submission (`POST`) and an admin-key-gated read endpoint (`GET`), talking to MongoDB via a cached Mongoose connection in `lib/mongodb.ts`.
- SEO is handled through `app/sitemap.ts`, `app/robots.ts`, and `app/opengraph-image.tsx`.

## Project Structure

```
app/
  about/page.tsx          # About page
  contact/page.tsx        # Contact page (booking form)
  api/enquiry/route.ts     # POST (submit enquiry) / GET (admin list)
  layout.tsx               # Root layout, fonts, metadata
  page.tsx                  # Home page
  robots.ts / sitemap.ts   # SEO routes (env-driven base URL)
  opengraph-image.tsx      # OG image generation
  globals.css               # Tailwind import + design tokens

components/
  about/                    # About page sections
  contact/                  # BookingForm, PhoneField
  home/                     # Hero, destination cards/sections, CTA, etc.
  layout/                   # Navbar, MobileMenu, Footer
  motion/                   # Reveal animation wrapper
  ui/                        # Shared primitives (Button, Container)

data/
  destinations.ts            # Static destination data
  offices.ts                  # Static office location data

lib/
  mongodb.ts                  # Cached Mongoose connection
  rateLimit.ts                 # In-memory per-IP token bucket
  utils.ts                      # Shared utilities
  validations.ts                 # Shared Zod enquiry schema

models/
  Enquiry.ts                    # Mongoose schema/model

types/
  destination.ts, enquiry.ts     # Shared TypeScript types

tests/                            # Vitest + Testing Library test suites
```

## Design System

Defined as CSS custom properties in `app/globals.css` via Tailwind's `@theme`:

- **Colors:** `ink` (#1c2321), `paper` (#f7f4ec), `canvas-deep` (#12181b), `terra` (#c1552c), `moss` (#5b6e52), `horizon` (#2e5266), `sand` (#e4dcc8)
- **Fonts:** `--font-display` → Fraunces (serif), `--font-sans` → Inter, `--font-mono` → JetBrains Mono, all loaded via `next/font/google`

## Local Development

```bash
npm install
cp .env.example .env.local
# fill in MONGODB_URI and ADMIN_API_KEY in .env.local
npm run dev
```

Visit `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | Connection string for the MongoDB database (Atlas or local). Required for the enquiry API to function. |
| `ADMIN_API_KEY` | Secret string required in the `x-admin-key` header to authorize `GET /api/enquiry`. |
| `NEXT_PUBLIC_SITE_URL` | Public base URL of the deployment, used by `app/robots.ts` and `app/sitemap.ts`. Falls back to `http://localhost:3000` if unset. |

## API

### `POST /api/enquiry`

Submits a new travel enquiry.

**Request body** (JSON):

```json
{
  "fullName": "string",
  "countryCode": "+91",
  "contactNumber": "string",
  "email": "string",
  "dateOfTravel": "ISO date string (must be in the future)",
  "numberOfPeople": 1,
  "hotelCategory": "Standard | Deluxe | Luxury",
  "numberOfChildren": 0,
  "destination": "string (optional)"
}
```

**Responses:**

- `201` — `{ success: true, id, message }`
- `400` — invalid JSON, or `{ success: false, message, fieldErrors }` on validation failure
- `429` — `{ success: false, message }` when the per-IP rate limit is exceeded
- `500` — `{ success: false, message }` on server/database error

Also includes a hidden honeypot field (`companyWebsite`) — bots that fill it in receive a fake `201` success without a database write.

### `GET /api/enquiry`

Admin-only listing of all enquiries, newest first. Requires an `x-admin-key` header matching `ADMIN_API_KEY`.

**Responses:**

- `200` — `{ success: true, count, enquiries: [...] }`
- `401` — `{ success: false, message: "Unauthorized" }` if the header is missing or incorrect
- `500` — `{ success: false, message }` on server/database error

## Database Schema

`Enquiry` model (`models/Enquiry.ts`):

| Field | Type | Notes |
|---|---|---|
| `fullName` | String | required, max 100 chars |
| `countryCode` | String | required |
| `contactNumber` | String | required |
| `email` | String | required, lowercased |
| `dateOfTravel` | Date | required |
| `numberOfPeople` | Number | required, min 1 |
| `hotelCategory` | String enum | `Standard`, `Deluxe`, `Luxury` |
| `numberOfChildren` | Number | default 0, min 0 |
| `destination` | String | optional |
| `status` | String enum | `new`, `contacted`, `converted`, `closed` — default `new` |
| `createdAt` / `updatedAt` | Date | via Mongoose timestamps |

## Testing

```bash
npm run test
```

Covers page rendering (home, about), the navbar, the booking form, destination data, and the enquiry API route, plus SEO output (`robots.ts` / `sitemap.ts`).

> **Note:** `tests/api-enquiry.test.ts` uses `mongodb-memory-server`, which downloads a MongoDB binary on first run. This requires network access the first time the test suite runs (subsequent runs use the cached binary).

## Validation

Enquiry data is validated with a single Zod schema (`lib/validations.ts`, `enquirySchema`), imported by both the client-side booking form (via `@hookform/resolvers/zod`) and the server-side API route. This keeps client and server validation rules in sync by construction rather than duplicating them.

## Deployment

1. Push the repository to GitHub.
2. Create a free MongoDB Atlas cluster and get a connection string.
3. Import the repo into a new Vercel project.
4. Set `MONGODB_URI`, `ADMIN_API_KEY`, and `NEXT_PUBLIC_SITE_URL` as environment variables in the Vercel dashboard.
5. Deploy.

See `DEPLOYMENT.md` for the full step-by-step checklist.

**Note on Atlas network access:** for simplicity this project assumes MongoDB Atlas Network Access is opened to `0.0.0.0/0` (allow from anywhere), since Vercel serverless functions don't have static outbound IPs on standard plans. This is a documented tradeoff — see `DEPLOYMENT.md` for the stricter alternative.

## Assumptions and Features Intentionally Excluded

Per the assignment brief, the following were explicitly out of scope for this project:

- Destination detail pages (only listing/cards on the home page)
- User authentication / accounts
- Payments or booking checkout
- A full admin dashboard UI (the `GET /api/enquiry` endpoint exists as a bonus, key-gated data endpoint only, with no UI)

## Live Demo


Travel Unbounded : https://travel-unbounded-chi.vercel.app/
=======