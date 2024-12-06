import prisma from "../../db";
import { createChannel, setupExchange, setupQueue } from "../rabbitmq";

export async function auctionTimeRemainingConsumer(
  exchange: string,
  queue: string,
) {
  const { channel } = await createChannel();
  await setupExchange(channel, exchange, "x-delayed-message", {
    durable: true,
    arguments: { "x-delayed-type": "direct" },
  });

  await setupQueue(channel, queue, exchange, "auction.time");

  channel.consume(queue, async (msg) => {
    if (msg) {
      const payload = JSON.parse(msg.content.toString());

      try {
        const watchlistsWatchingAuction =
          await prisma.auctionsOnWatchlists.findMany({
            where: { auctionId: payload.auction.id },
            include: {
              watchlist: {
                select: { userId: true },
              },
              auction: true,
            },
          });

        const watchingUserIds = watchlistsWatchingAuction.map(
          (list) => list.watchlist.userId,
        );
        const { auction } = watchlistsWatchingAuction[0];
        const sellerId = auction.sellerId;

        const message = JSON.stringify({
          eventType: "AUCTION_TIME_REMAINING",
          userIds: [...watchingUserIds],
          sellerId: [sellerId],
          auction,
        });

        channel.publish(exchange, "auction.time", Buffer.from(message), {});
      } catch (error) {
        console.error(
          `Failed to send auction time remaining message for auction ${auctionId}:`,
          error.message,
        );
      }

      channel.ack(msg);
    }
  });

  console.log(
    `Listening for auction time remaining messages on queue ${queue}`,
  );
}
