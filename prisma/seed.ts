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

function generateKeywordFromTitle(title: string): string {
  // Tokenize the title into words
  const words = title.split(" ");

  // Ensure there are at least two words to choose from
  if (words.length < 2) {
    return words[0]?.toLowerCase() || ""; // Return the single word as a keyword
  }

  // Randomly select 2-3 words from the title
  const keywordWords = faker.helpers.arrayElements(
    words,
    faker.number.int({ min: 2, max: 3 }),
  );

  // Join selected words to form the keyword
  return keywordWords.join(" ").toLowerCase();
}

// Example usage
const auctionTitle = "Brand new Vintage Modern Chair";
const keyword = generateKeywordFromTitle(auctionTitle);
console.log(`Generated keyword: ${keyword}`);

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
      maxPrice: parseFloat(faker.commerce.price({ min: 500, max: 5000 })),
      userId: ADMIN_USERID,
      keyword: generateKeywordFromTitle(faker.commerce.productName()),
    },
  });

  // Associate random categories with the admin watchlist
  console.log("Associating categories with admin's watchlist...");
  const adminCategories = faker.helpers.arrayElements(categories, 3); // Select 3 random categories
  for (const category of adminCategories) {
    await prisma.categoriesOnWatchlists.create({
      data: {
        watchlistId: adminWatchlist.id,
        categoryId: category.id,
      },
    });
  }

  // Create 10 auctions for the admin user
  console.log(`Seeding 10 auctions for ADMIN_USERID: ${ADMIN_USERID}`);
  for (let i = 0; i < 10; i++) {
    const startPrice = parseFloat(faker.commerce.price({ min: 5, max: 800 }));
    const buyItNowPrice =
      startPrice + parseFloat(faker.commerce.price({ min: 5, max: 300 }));
    const shippingPrice = parseFloat(faker.commerce.price({ min: 1, max: 15 }));
    const startTime = faker.date.recent({ days: 7 });

    const auction = await prisma.auction.create({
      data: {
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        startPrice: startPrice,
        shippingPrice: shippingPrice,
        buyItNowPrice: buyItNowPrice,
        startTime,
        endTime: faker.date.future({ years: 1, refDate: startTime }),
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

    // Add auction to admin's watchlist
    await prisma.auctionsOnWatchlists.create({
      data: {
        watchlistId: adminWatchlist.id,
        auctionId: auction.id,
      },
    });

    // Add bids to the auction
    const bidCount = faker.number.int({ min: 1, max: 5 });
    let highestBid = startPrice;
    for (let j = 0; j < bidCount; j++) {
      let maxBidAmount = buyItNowPrice;
      const minBidAmount = highestBid + 1;

      if (maxBidAmount <= minBidAmount) {
        maxBidAmount = minBidAmount + 1;
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
          userId: ADMIN_USERID,
          auctionId: auction.id,
        },
      });
    }
  }

  // Create 90 additional users
  console.log("Creating 90 additional users...");
  for (let i = 0; i < 90; i++) {
    const userId = faker.string.uuid();
    const userName = faker.person.fullName();

    // Create a watchlist for the user
    const userWatchlist = await prisma.watchlist.create({
      data: {
        name: `${userName}'s Watchlist`,
        maxPrice: parseFloat(faker.commerce.price({ min: 500, max: 5000 })),
        userId: userId,
        keyword: generateKeywordFromTitle(faker.commerce.productName()),
      },
    });

    console.log(
      `Created watchlist: ${userWatchlist.name} for userId: ${userId}`,
    );

    // Associate random categories with the user's watchlist
    const userCategories = faker.helpers.arrayElements(categories, 2); // Select 2 random categories
    for (const category of userCategories) {
      await prisma.categoriesOnWatchlists.create({
        data: {
          watchlistId: userWatchlist.id,
          categoryId: category.id,
        },
      });
    }

    // Create 10 auctions for each user
    for (let j = 0; j < 10; j++) {
      const startPrice = parseFloat(
        faker.commerce.price({ min: 10, max: 800 }),
      );
      const buyItNowPrice =
        startPrice + parseFloat(faker.commerce.price({ min: 5, max: 100 }));
      const shippingPrice = parseFloat(
        faker.commerce.price({ min: 1, max: 10 }),
      );
      const startTime = faker.date.recent({ days: 7 });

      const auction = await prisma.auction.create({
        data: {
          title: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          startPrice: startPrice,
          shippingPrice: shippingPrice,
          buyItNowPrice: buyItNowPrice,
          startTime,
          endTime: faker.date.future({ years: 1, refDate: startTime }),
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
      for (let j = 0; j < bidCount; j++) {
        let maxBidAmount = buyItNowPrice;
        const minBidAmount = highestBid + 1;

        if (maxBidAmount <= minBidAmount) {
          maxBidAmount = minBidAmount;
        }

        const bidAmount = parseFloat(
          faker.commerce.price({
            min: minBidAmount,
            max: maxBidAmount + 1,
          }),
        );

        highestBid = bidAmount;

        await prisma.bid.create({
          data: {
            amount: highestBid,
            placedAt: faker.date.recent({ days: 5 }),
            userId: faker.string.uuid(),
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
