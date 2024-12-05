import { createChannel, setupExchange } from "../rabbitmq";

export async function scheduleTimeRemainingNotifications(auction, userIds) {
  const { connection, channel } = await createChannel();
  const exchange = "auction-exchange";

  await setupExchange(channel, exchange, "x-delayed-message", {
    durable: true,
    arguments: { "x-delayed-type": "direct" },
  });

  const { endTime } = auction;

  const reminderDelays = {
    oneWeek: endTime.getTime() - 7 * 24 * 60 * 60 * 1000 - Date.now(),
    threeDays: endTime.getTime() - 3 * 24 * 60 * 60 * 1000 - Date.now(),
    oneDay: endTime.getTime() - 1 * 24 * 60 * 60 * 1000 - Date.now(),
    twelveHours: endTime.getTime() - 12 * 60 * 60 * 1000 - Date.now(),
    fiveMinutes: endTime.getTime() - 5 * 60 * 1000 - Date.now(),
  };

  for (const [key, delay] of Object.entries(reminderDelays)) {
    if (delay > 0) {
      const message = JSON.stringify({ auction, userIds });
      channel.publish(exchange, "auction.time", Buffer.from(message), {
        headers: { "x-delay": delay },
      });

      console.log(
        `Scheduled ${key} reminder for auction ${auction.id} (${delay}ms).`,
      );
    }
  }

  await channel.close();
  await connection.close();
}
