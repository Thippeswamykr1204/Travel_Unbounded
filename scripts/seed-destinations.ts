// dotenv/config only loads a file literally named ".env" by default — this
// project only has ".env.local" (the file Next.js's own dev server loads
// automatically). Point dotenv at it explicitly so this standalone script
// sees the same env vars `npm run dev` does.
import { config } from "dotenv";
config({ path: ".env.local" });

import { connectDB } from "../lib/mongodb";
import { getDestinationModel } from "../models/Destination";
import { destinations } from "../data/destinations";

async function main() {
  await connectDB();
  const Destination = getDestinationModel();

  let created = 0;
  let updated = 0;

  for (const entry of destinations) {
    const slug = entry.id.trim().toLowerCase();

    const result = await Destination.updateOne(
      { slug },
      {
        $set: {
          slug,
          name: entry.name,
          country: entry.country,
          category: entry.category,
          mood: entry.mood,
          image: entry.image,
          description: entry.description,
          price: entry.price,
          currency: entry.currency,
          duration: entry.duration,
          active: true,
        },
        $setOnInsert: { featured: false },
      },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      created += 1;
    } else if (result.modifiedCount > 0) {
      updated += 1;
    }
  }

  console.log(
    `Destinations seeded successfully: ${created} created, ${updated} updated, ${destinations.length} total processed.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(
      "Failed to seed destinations:",
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  });