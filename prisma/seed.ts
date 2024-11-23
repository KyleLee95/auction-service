import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

import { exec } from "child_process";
import { promisify } from "util";
const prisma = new PrismaClient();
const ADMIN_USERID: string = process.env.ADMIN_USERID || ""; // Replace with the desired admin user UUID
const CATEGORY_NAMES = [
  { label: "Autos", value: "autos" },
  {
    label: "Clothing, Shoes & Accessories",
    value: "clothing-shoes-accessories",
  },
  { label: "Electronics", value: "electronics" },
  { label: "Sporting Goods", value: "sporting-goods" },
  { label: "Jewelry & Watches", value: "jewelry-watches" },
  { label: "Collectibles", value: "collectibles" },
];

const execAsync = promisify(exec);

async function runMigrations() {
  console.log("Running migrations...");
  try {
    await execAsync("npx prisma migrate deploy");
    console.log("Migrations applied successfully!");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}

async function clearDatabase() {
  console.log("Dropping and recreating tables...");

  // Drop all tables
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      EXECUTE (
        SELECT string_agg('DROP TABLE IF EXISTS "' || tablename || '" CASCADE', '; ')
        FROM pg_tables
        WHERE schemaname = 'public'
      );
    END $$;
  `);

  console.log("Tables dropped!");

  // Run migrations to recreate the schema
  console.log("Recreating tables...");
  await prisma.$executeRawUnsafe(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Example for extensions
  `);
  await prisma.$disconnect();
  await runMigrations();

  console.log("Database reset complete!");
}

async function main() {
  await clearDatabase();

  console.log("Seeding database...");

  // Create Admin User
  console.log("Creating admin user");
  const adminUser = await prisma.user.create({
    data: {
      awsId: ADMIN_USERID,
      name: "Admin User",
      isAdmin: true,
      suspended: false,
    },
  });

  console.log("Creating example categories");
  const categories = [];
  for (const { label, value } of CATEGORY_NAMES) {
    const category = await prisma.category.create({
      data: {
        label,
        value,
      },
    });
    categories.push(category);
  }

  console.log("Seeding 10 auctions for admin user");
  // Create 10 auctions for the admin user
  for (let j = 1; j <= 30; j++) {
    const auction = await prisma.auction.create({
      data: {
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        startPrice: parseFloat(faker.commerce.price()),
        shippingPrice: parseFloat(faker.commerce.price({ min: 1, max: 20 })),
        startTime: faker.date.recent({
          days: Math.floor(Math.random() * 6) + 1,
        }),
        buyItNowEnabled: faker.datatype.boolean(),
        isActive: faker.datatype.boolean(),
        endTime: faker.date.future({ years: 1, refDate: Date.now() }),
        quantity: faker.number.int({ min: 1, max: 5 }),
        sellerId: ADMIN_USERID,
      },
    });

    // Attach a random category to the auction
    const randomCategory = faker.helpers.arrayElement(categories);
    await prisma.categoriesOnAuctions.create({
      data: {
        auctionId: auction.id,
        categoryId: randomCategory.id,
      },
    });

    // Add between 0 and 5 bids for each auction
    const bidCount = faker.number.int({ min: 0, max: 10 });
    for (let k = 0; k < bidCount; k++) {
      // Select a random existing user
      const randomUser = await prisma.user.findFirst({
        skip: faker.number.int({ min: 0, max: 99 }),
      });
      const randomBidderId = randomUser ? randomUser.awsId : null;

      if (randomBidderId) {
        await prisma.bid.create({
          data: {
            amount: parseFloat(
              faker.commerce.price({ min: auction.startPrice, max: 1000 }),
            ),
            placedAt: faker.date.recent(),
            userId: randomBidderId,
            auctionId: auction.id,
          },
        });
      }
    }
  }

  // Create Watchlist for Admin User
  console.log("Creating watchlist for admin user");
  const adminWatchlist = await prisma.watchlist.create({
    data: {
      name: "Admin's Watchlist",
      userId: ADMIN_USERID,
    },
  });

  // Add 2 auctions to admin's watchlist
  const adminAuctionIds = await prisma.auction.findMany({
    where: { sellerId: ADMIN_USERID },
    select: { id: true },
    take: 2,
  });

  for (const auction of adminAuctionIds) {
    await prisma.auctionsOnWatchlists.create({
      data: {
        watchlistId: adminWatchlist.id,
        auctionId: auction.id,
      },
    });
  }

  // Attach 1 or 2 random categories to the watchlist
  const randomCategoriesForWatchlist = faker.helpers.arrayElements(
    categories,
    faker.number.int({ min: 1, max: 2 }),
  );
  for (const category of randomCategoriesForWatchlist) {
    await prisma.categoriesOnWatchlists.create({
      data: {
        watchlistId: adminWatchlist.id,
        categoryId: category.id,
      },
    });
  }

  // Create 99 other users and seed data for them
  console.log("Creating additional users and seeding their data");
  for (let i = 2; i <= 100; i++) {
    const userIdToUse = faker.string.uuid();
    const user = await prisma.user.create({
      data: {
        awsId: userIdToUse,
        name: faker.person.fullName(),
        isAdmin: faker.datatype.boolean(),
        suspended: faker.datatype.boolean(),
      },
    });

    console.log(`Seeding 10 auctions for user ${user.awsId}`);
    for (let j = 1; j <= 10; j++) {
      const auction = await prisma.auction.create({
        data: {
          title: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          startPrice: parseFloat(faker.commerce.price()),
          shippingPrice: parseFloat(faker.commerce.price({ min: 1, max: 20 })),
          startTime: faker.date.recent({
            days: Math.floor(Math.random() * 6) + 1,
          }),
          endTime: faker.date.future({ years: 1, refDate: Date.now() }),
          quantity: faker.number.int({ min: 1, max: 5 }),
          sellerId: user.awsId,
        },
      });

      // Attach a random category to the auction
      const randomCategory = faker.helpers.arrayElement(categories);
      await prisma.categoriesOnAuctions.create({
        data: {
          auctionId: auction.id,
          categoryId: randomCategory.id,
        },
      });

      const bidCount = faker.number.int({ min: 0, max: 5 });
      for (let k = 0; k < bidCount; k++) {
        const randomUser = await prisma.user.findFirst({
          skip: faker.number.int({ min: 0, max: 99 }),
        });
        const randomBidderId = randomUser ? randomUser.awsId : null;

        if (randomBidderId) {
          await prisma.bid.create({
            data: {
              amount: parseFloat(
                faker.commerce.price({ min: auction.startPrice, max: 1000 }),
              ),
              placedAt: faker.date.recent(),
              userId: randomBidderId,
              auctionId: auction.id,
            },
          });
        }
      }
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        name: `${user.name}'s Watchlist`,
        userId: user.awsId,
      },
    });

    const auctionIds = await prisma.auction.findMany({
      where: { sellerId: user.awsId },
      select: { id: true },
      take: 2,
    });

    for (const auction of auctionIds) {
      await prisma.auctionsOnWatchlists.create({
        data: {
          watchlistId: watchlist.id,
          auctionId: auction.id,
        },
      });
    }

    // Attach 1 or 2 random categories to the watchlist
    const randomCategories = faker.helpers.arrayElements(
      categories,
      faker.number.int({ min: 1, max: 2 }),
    );
    for (const category of randomCategories) {
      await prisma.categoriesOnWatchlists.create({
        data: {
          watchlistId: watchlist.id,
          categoryId: category.id,
        },
      });
    }
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
