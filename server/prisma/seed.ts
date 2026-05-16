import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed the database with initial sensor status
  const sensorStatus = await prisma.sensorStatus.upsert({
    where: { id: 1 },
    update: {},
    create: {
      status: "0",
      lastImageUrl: null,
      lastImageKey: null,
    },
  });

  console.log("Database seeded with sensor status:", sensorStatus);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
