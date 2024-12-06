import cron from "node-cron";
import prisma from "../db";
import type { Auction } from "@prisma/client";

const sendAuctionsToMetricsService = async (closedAuctions: Auction[]) => {
  try {
    const res = await fetch("/api/metrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ auctions: closedAuctions }),
    });

    if (!res.ok) {
      console.error(res);
      return res;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
  }
};

// Function to query and process auctions closed in the last 24 hours
async function processRecentlyClosedAuctions() {
  try {
    // Calculate the time range
    const now = new Date();
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(now.getHours() - 24);

    // Query the database for auctions closed in the last 24 hours
    const recentlyClosedAuctions = await prisma.auction.findMany({
      where: {
        closedAt: {
          gte: twentyFourHoursAgo,
          lte: now,
        },
      },
      include: {
        bids: {
          orderBy: { amount: "desc" },
        },
      },
    });

    if (recentlyClosedAuctions.length > 0) {
      console.log(
        `Found ${recentlyClosedAuctions.length} auctions closed in the last 24 hours.`,
      );

      const data = await sendAuctionsToMetricsService(recentlyClosedAuctions);
      return data;
    } else {
      console.log("No auctions closed in the last 24 hours.");
    }
  } catch (err) {
    console.error("Error processing recently closed auctions:", err);
  }
}

// Schedule the cron job to run daily at midnight (or adjust as needed)
const startCronJob = () => {
  const testString = "* * * * *";
  // const twentyFourHours = "0 0 * * *";
  cron.schedule(testString, async () => {
    console.log("Running cron job for processing recently closed auctions...");
    try {
      await processRecentlyClosedAuctions();
    } catch (err) {
      console.error(err);
    }
  });

  console.log("Cron job scheduled for processing recently closed auctions.");
};

export { startCronJob };
