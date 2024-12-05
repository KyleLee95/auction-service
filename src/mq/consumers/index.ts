import { startAuctionConsumer } from "./auctionStartConsumer";
import { endAuctionConsumer } from "./auctionEndConsumer";
import { auctionTimeRemainingConsumer } from "./auctionTimeRemainingConsumer";

const exchange = "auction-exchange";

async function startConsumers() {
  console.log("Starting consumers...");

  await Promise.all([
    startAuctionConsumer(exchange, "auction-start-queue"),
    endAuctionConsumer(exchange, "auction-end-queue"),
    auctionTimeRemainingConsumer(exchange, "auction-time-remaining-queue"),
  ]);
  console.log("All Consumers are running.");
}

export { startConsumers };
