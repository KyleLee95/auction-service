import { createChannel, setupExchange } from "../rabbitmq";

export async function notifyNewBid({
  userIds,
  auction,
  bid,
}: {
  userIds: string[];
  auction: unknown;
  bid: unknown;
}) {
  const { connection, channel } = await createChannel();
  const exchange = "notification-exchange";

  await setupExchange(channel, exchange, "direct", { durable: true });

  const message = JSON.stringify({
    userIds,
    auction,
    bid,
    eventType: "NEW_BID",
  });

  channel.publish(exchange, "bid.new", Buffer.from(message));
  console.log(`Notified users of new bid on auction ${auction.id}.`);

  await channel.close();
  await connection.close();
}
