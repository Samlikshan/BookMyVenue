import "dotenv/config";
import { prisma } from "../src/config/prisma.js";

async function main() {
  const eventTypes = [
    "Wedding",
    "Birthday",
    "Corporate Event",
    "Conference",
    "Reception",
  ];

  for (const name of eventTypes) {
    await prisma.eventType.upsert({
      where: { name },
      update: { isActive: true },
      create: { name },
    });
  }

  console.log("Seeded event types");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
