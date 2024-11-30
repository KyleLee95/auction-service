import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const ADMIN_USERID: string = process.env.ADMIN_USERID || faker.string.uuid(); // Use ADMIN_USERID or generate one if not provided

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

  // Create example categories
  console.log("Creating example categories...");
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

  const categories = [];
  for (const { label, value } of CATEGORY_NAMES) {
    const category = await prisma.category.create({
      data: { label, value },
    });
    categories.push(category);
  }

  // Create admin watchlist
  console.log(`Creating watchlist for ADMIN_USERID: ${ADMIN_USERID}`);
  const adminWatchlist = await prisma.watchlist.create({
    data: {
      name: "Admin's Watchlist",
      maxPrice: 50000, // Example max price in cents ($500)
      userId: ADMIN_USERID,
    },
  });

  // Create 10 auctions for the admin user
  console.log(`Seeding 10 auctions for ADMIN_USERID: ${ADMIN_USERID}`);
  for (let i = 0; i < 10; i++) {
    const startPrice = parseFloat(faker.commerce.price({ min: 10, max: 100 })); // Normalize to cents
    const buyItNowPrice =
      startPrice + parseFloat(faker.commerce.price({ min: 5, max: 50 })); // Normalize to cents
    const startTime = faker.date.recent({ days: 7 });
    const auction = await prisma.auction.create({
      data: {
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        startPrice: startPrice,
        shippingPrice: parseFloat(faker.commerce.price({ min: 1, max: 10 })), // Normalize to cents
        buyItNowPrice: buyItNowPrice,
        startTime,
        endTime: faker.date.future({ refDate: startTime }),
        quantity: faker.number.int({ min: 1, max: 5 }),
        isActive: true,
        buyItNowEnabled: faker.datatype.boolean(),
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

    // Add bids to the auction
    const bidCount = faker.number.int({ min: 1, max: 5 });
    let highestBid = startPrice;
    for (let j = 0; j < bidCount; j++) {
      let maxBidAmount = buyItNowPrice;
      const minBidAmount = highestBid + 100; // At least 1 cent above the highest bid

      // Ensure maxBidAmount is valid
      if (maxBidAmount <= minBidAmount) {
        maxBidAmount = minBidAmount + 100; // Add a buffer if max <= min
      }

      const bidAmount = parseFloat(
        faker.commerce.price({
          min: minBidAmount,
          max: maxBidAmount,
        }),
      ); // Normalize to cents

      highestBid = bidAmount;

      await prisma.bid.create({
        data: {
          amount: highestBid,
          placedAt: faker.date.recent({ days: 5 }),
          userId: faker.string.uuid(), // Random bidder
          auctionId: auction.id,
        },
      });
    }

    // Add auction to admin's watchlist
    await prisma.auctionsOnWatchlists.create({
      data: {
        watchlistId: adminWatchlist.id,
        auctionId: auction.id,
      },
    });
  }

  // Create 100 additional users
  console.log("Creating 100 additional users...");
  for (let i = 0; i < 100; i++) {
    const userId = faker.string.uuid();
    const userName = faker.person.fullName();

    // Create a watchlist for the user
    const userWatchlist = await prisma.watchlist.create({
      data: {
        name: `${userName}'s Watchlist`,
        maxPrice: faker.number.int({ min: 5000, max: 50000 }), // Random max price in cents
        userId: userId,
      },
    });

    console.log(
      `Created watchlist: ${userWatchlist.name} for userId: ${userId}`,
    );

    // Create 10 auctions for each user
    for (let j = 0; j < 10; j++) {
      const startPrice = parseFloat(
        faker.commerce.price({ min: 10, max: 100 }),
      ); // Normalize to cents
      const buyItNowPrice =
        startPrice + parseFloat(faker.commerce.price({ min: 5, max: 50 })); // Normalize to cents
      const startTime = faker.date.recent({ days: 7 });
      const auction = await prisma.auction.create({
        data: {
          title: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          startPrice: startPrice,
          shippingPrice: parseFloat(faker.commerce.price({ min: 1, max: 10 })), // Normalize to cents
          buyItNowPrice: buyItNowPrice,
          startTime,
          endTime: faker.date.future({ refDate: startTime }),
          quantity: faker.number.int({ min: 1, max: 5 }),
          isActive: true,
          buyItNowEnabled: faker.datatype.boolean(),
          sellerId: userId,
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

      // Add bids to the auction
      const bidCount = faker.number.int({ min: 1, max: 5 });
      let highestBid = startPrice;
      for (let k = 0; k < bidCount; k++) {
        let maxBidAmount = buyItNowPrice;
        const minBidAmount = highestBid + 100; // At least 1 cent above the highest bid

        // Ensure maxBidAmount is valid
        if (maxBidAmount <= minBidAmount) {
          maxBidAmount = minBidAmount + 100; // Add a buffer if max <= min
        }

        const bidAmount = parseFloat(
          faker.commerce.price({
            min: minBidAmount,
            max: maxBidAmount,
          }),
        );

        highestBid = bidAmount;

        await prisma.bid.create({
          data: {
            amount: highestBid,
            placedAt: faker.date.recent({ days: 5 }),
            userId: faker.string.uuid(), // Random bidder
            auctionId: auction.id,
          },
        });
      }

      // Add auction to the user's watchlist
      await prisma.auctionsOnWatchlists.create({
        data: {
          watchlistId: userWatchlist.id,
          auctionId: auction.id,
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
