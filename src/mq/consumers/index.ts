import { startAuctionConsumer } from "./auctionStartConsumer";
import { endAuctionConsumer } from "./auctionEndConsumer";
import { auctionTimeRemainingConsumer } from "./auctionTimeRemainingConsumer";

const exchange = "auction-exchange";

async function startConsumers() {
  await startAuctionConsumer(exchange, "auction-start-queue");
  await endAuctionConsumer(exchange, "auction-end-queue");
  await auctionTimeRemainingConsumer(exchange, "auction-time-remaining-queue");
  console.log("started consumers");
}

export { startConsumers };
