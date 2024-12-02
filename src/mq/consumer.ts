import amqp from "amqplib";
import prisma from "../db";

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

const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost";
const connectionString = `amqp://${rabbitmqHost}:5672`;

async function startConsumer() {
  const connection = await amqp.connect(connectionString);
  const channel = await connection.createChannel();

  const exchange = "delayed-exchange";
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
        await toggleAuctionActiveStatus(auctionId, false);
        console.log(`Ended auction ${auctionId} successfully.`);
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
    `Auction consumer is running! Listening for messages on exchange ${exchange} from queue(s) ${auctionStartQueue}, ${auctionEndQueue}.`,
  );
}

export { startConsumer };
