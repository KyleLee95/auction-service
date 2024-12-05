import amqp from "amqplib";
import prisma from "../db";

import type { CompleteAuction, CompleteBid } from "../../prisma/zod";

interface AuctionData {
  auction: CompleteAuction;
  bid: CompleteBid;
}

const rabbitmqHost =
  process.env.DEV === "TRUE" ? "localhost" : process.env.RABBITMQ_HOST;
const connectionString = `amqp://${rabbitmqHost}:5672`;

export async function createChannel() {
  const connection = await amqp.connect(connectionString);
  const channel = await connection.createChannel();
  return { connection, channel };
}

export async function setupExchange(
  channel: amqp.Channel,
  exchange: string,
  type: string,
  options?: amqp.Options.AssertExchange,
) {
  await channel.assertExchange(exchange, type, options);
}

export async function setupQueue(
  channel: amqp.Channel,
  queue: string,
  exchange: string,
  routingKey: string,
  options?: amqp.Options.AssertQueue,
) {
  await channel.assertQueue(queue, options);
  await channel.bindQueue(queue, exchange, routingKey);
}

export async function sendAuctionDataToCartService(auctionData: AuctionData) {
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

export const toggleAuctionActiveStatus = async (
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

export const endAuction = async (auctionId: number): Promise<AuctionData> => {
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
