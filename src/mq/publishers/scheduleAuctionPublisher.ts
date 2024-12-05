import { createChannel, setupExchange } from "../rabbitmq";

export async function scheduleAuction(
  auctionId: number,
  startTime: Date,
  endTime: Date,
) {
  const { connection, channel } = await createChannel();
  const exchange = "auction-exchange";

  await setupExchange(channel, exchange, "x-delayed-message", {
    durable: true,
    arguments: { "x-delayed-type": "direct" },
  });

  const startTimeDelay = startTime.getTime() - Date.now();
  const delay = startTimeDelay <= 0 ? 20 : startTimeDelay;

  const message = JSON.stringify({ auctionId });
  channel.publish(exchange, "auction.start", Buffer.from(message), {
    headers: { "x-delay": delay },
  });

  console.log(
    `Scheduled auction ${auctionId} to start in ${delay}ms (${startTime.toISOString()}).`,
  );

  const endTimeDelay = endTime.getTime() - Date.now();
  channel.publish(exchange, "auction.end", Buffer.from(message), {
    headers: { "x-delay": endTimeDelay },
  });

  console.log(
    `Scheduled auction ${auctionId} to end in ${endTimeDelay}ms (${endTime.toISOString()}).`,
  );

  await channel.close();
  await connection.close();
}
