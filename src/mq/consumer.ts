import amqp from "amqplib";
import prisma from "../db";

import type { CompleteAuction, CompleteBid } from "../../prisma/zod";

interface AuctionData {
  auction: CompleteAuction;
  bid: CompleteBid;
}

const rabbitmqHost = process.env.DEV ? "localhost" : process.env.RABBITMQ_HOST;
const connectionString = `amqp://${rabbitmqHost}:5672`;

async function sendAuctionDataToCartService(auctionData: AuctionData) {
  const connection = await amqp.connect(connectionString);
  const channel = await connection.createChannel();
  const exchange = "cart-exchange";

  await channel.assertExchange(exchange, "direct", {
    durable: true,
  });

  const message = JSON.stringify({ auctionData });

  console.log(
    `Sending ${auctionData.auction.id} data to the ${exchange} exchange`,
  );
  channel.publish(exchange, "auction.atc", Buffer.from(message), {});

  await channel.close();
  await connection.close();
}

const toggleAuctionActiveStatus = async (
  auctionId: number,
  status: boolean,
) => {
  const activatedAuction = await prisma.auction.update({
    where: {
      id: auctionId,
    },
    data: {
      isActive: status,
    },
  });
  return activatedAuction;
};

const endAuction = async (auctionId: number): Promise<AuctionData> => {
  const highestBid = await prisma.bid.findFirst({
    where: {
      auctionId: auctionId,
    },
    orderBy: { amount: "desc" },
    take: 1,
  });
  const endedAuction = await prisma.auction.update({
    where: {
      id: auctionId,
    },
    data: {
      isActive: false,
      buyerId: highestBid?.userId,
      closedAt: new Date().toISOString(),
    },
  });

  return { auction: endedAuction, bid: highestBid };
};

async function startConsumer() {
  const connection = await amqp.connect(connectionString);
  const channel = await connection.createChannel();

  const exchange = "auction-exchange";
  const auctionStartQueue = "auction-start-queue";
  const auctionEndQueue = "auction-end-queue";

  await channel.assertExchange(exchange, "x-delayed-message", {
    durable: true,
    arguments: { "x-delayed-type": "direct" },
  });

  await channel.assertQueue(auctionStartQueue, { durable: true });
  await channel.bindQueue(auctionStartQueue, exchange, "auction.start");

  channel.consume(auctionStartQueue, async (msg) => {
    if (msg) {
      const { auctionId } = JSON.parse(msg.content.toString());

      try {
        console.log(`Activating auction ${auctionId}...`);
        await toggleAuctionActiveStatus(auctionId, true);
        console.log(`Auction ${auctionId} activated successfully.`);
      } catch (error) {
        console.error(
          `Failed to activate auction ${auctionId}:`,
          error.message,
        );
      }

      channel.ack(msg);
    }
  });

  await channel.assertQueue(auctionEndQueue, { durable: true });
  await channel.bindQueue(auctionEndQueue, exchange, "auction.end");

  channel.consume(auctionEndQueue, async (msg) => {
    if (msg) {
      const { auctionId } = JSON.parse(msg.content.toString());

      try {
        const auctionData = await endAuction(auctionId);
        console.log(`Ended auction ${auctionId} successfully.`);
        await sendAuctionDataToCartService(auctionData);
      } catch (error) {
        console.error(
          `Failed to deactivate auction ${auctionId}:`,
          error.message,
        );
      }

      channel.ack(msg);
    }
  });

  console.log(
    `Auction consumer is running! Listening for messages on exchange ${exchange} from queue(s) ${auctionStartQueue}, ${auctionEndQueue}..`,
  );
}

export { startConsumer };
