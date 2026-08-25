# Deployment Checklist

Manual steps to take Travel Unbounded from local to a live production URL.

- [ ] **Push final code to GitHub.** Commit all Tier 10 changes and push to the repo's default branch.

- [ ] **Create a MongoDB Atlas free cluster.**
  - Sign up / log in at [mongodb.com/atlas](https://www.mongodb.com/atlas).
  - Create a free (M0) cluster.
  - Create a database user (username + password) under **Database Access**.
  - Get the connection string under **Connect → Drivers** (looks like `mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority`).

- [ ] **Configure Atlas Network Access.** Under **Network Access**, add an IP entry. Two options:
  - **`0.0.0.0/0` (allow from anywhere)** — simplest, works with Vercel's dynamic serverless IPs out of the box. This is the assumption documented in the README as a tradeoff for this project's scope.
  - **Vercel's specific IP ranges** — stricter, but requires a paid Vercel plan with static IPs (or a Vercel integration that manages this for you), since standard serverless functions don't have fixed outbound IPs. Only use this if you've set up static/fixed IPs for the deployment.

- [ ] **Import the GitHub repo into a new Vercel project.** Go to [vercel.com/new](https://vercel.com/new), select the repo, keep the default Next.js build settings.

- [ ] **Set environment variables in the Vercel dashboard** (Project Settings → Environment Variables):
  - `MONGODB_URI` — the Atlas connection string from above.
  - `ADMIN_API_KEY` — generate a random secure string (e.g. `openssl rand -hex 32`).
  - `NEXT_PUBLIC_SITE_URL` — leave blank for now; you'll fill this in after the first deploy once you know the URL, then redeploy.

- [ ] **Trigger deploy.** Let the first deployment finish and note the assigned `*.vercel.app` URL (or your custom domain).

- [ ] **Set `NEXT_PUBLIC_SITE_URL` and redeploy.** Go back to Environment Variables, set it to the real deployment URL, and trigger a redeploy so `robots.ts` and `sitemap.ts` pick it up.

- [ ] **Visit the live URL and submit a real test enquiry** through the actual contact/booking form.

- [ ] **Verify the record appears in MongoDB Atlas.** Atlas → your cluster → **Collections** → check the `enquiries` collection for the new document.

- [ ] **Test the `GET /api/enquiry` bonus endpoint** with the admin key header, e.g.:
  ```bash
  curl -H "x-admin-key: <your ADMIN_API_KEY>" https://<your-live-url>/api/enquiry
  ```
  (or the equivalent request in Postman). Confirm it returns `200` with the enquiry list, and returns `401` without the header or with a wrong key.

- [ ] **Re-run the responsive/accessibility spot checks from Tier 9 against the LIVE URL**, not localhost — resize/viewport checks, keyboard navigation, screen-reader landmarks, etc.