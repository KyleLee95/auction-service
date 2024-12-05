import { createChannel, setupExchange } from "../rabbitmq";

export async function notifyMatchingWatchlistUsers({
  userIds,
  auction,
}: {
  userIds: string[];
  auction: unknown;
}) {
  const { connection, channel } = await createChannel();
  const exchange = "notification-exchange";

  await setupExchange(channel, exchange, "direct", { durable: true });

  const message = JSON.stringify({
    eventType: "NOTIFY_WATCHLIST_MATCH",
    userIds,
    auction,
  });

  channel.publish(exchange, "watchlist.match", Buffer.from(message));
  console.log(`Notified watchlist users for auction ${auction.id}.`);

  await channel.close();
  await connection.close();
}
