import amqp from "amqplib";
const rabbitmqHost = process.env.DEV ? "localhost" : process.env.RABBITMQ_HOST;
const connectionString = `amqp://${rabbitmqHost}:5672`;

async function scheduleAuction(
  auctionId: number,
  startTime: Date,
  endTime: Date,
) {
  const connection = await amqp.connect(connectionString);
  const channel = await connection.createChannel();
  const exchange = "auction-exchange";

  await channel.assertExchange(exchange, "x-delayed-message", {
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
    `Scheduled auction ${auctionId} to start in ${delay}ms, or ${startTime.toISOString()}.`,
  );

  const endTimeDelay = endTime.getTime() - Date.now();
  channel.publish(exchange, "auction.end", Buffer.from(message), {
    headers: { "x-delay": endTimeDelay },
  });

  console.log(
    `Scheduled auction ${auctionId} to end in ${endTimeDelay}ms, or ${endTime.toISOString()}.`,
  );
  await channel.close();
  await connection.close();
}

async function scheduleTimeRemainingNotifications(auction, userIds) {
  const connection = await amqp.connect(connectionString);
  const channel = await connection.createChannel();
  const exchange = "auction-exchange";
  const { startTime, endTime } = auction;

  await channel.assertExchange(exchange, "x-delayed-message", {
    durable: true,
    arguments: { "x-delayed-type": "direct" },
  });

  //7 days
  //3 days
  //24 hours
  //12 hours
  //5 minutes
  try {
    const reminderDelays = {
      oneWeek: new Date().setDate(endTime.getDate() - 7) - Date.now(),
      threeDays: new Date().setDate(endTime.getDate() - 3) - Date.now(),
      oneDay: new Date().setDate(endTime.getDate() - 1) - Date.now(),
      twelveHours: new Date().setDate(endTime.getDate() - 0.5) - Date.now(),
      fiveMinutes: new Date().setDate(endTime.getDate() - 0.08) - Date.now(),
    };

    for (const delay in reminderDelays) {
      const message = JSON.stringify({ auction, userIds });

      channel.publish(exchange, "auction.time", Buffer.from(message), {
        headers: { "x-delay": 0 },
      });
    }
    console.log(`Scheduled reminders for auction ${auction.id}.`);
  } catch (err) {
    console.error(err);
  }

  await channel.close();
  await connection.close();
}

async function notifyMatchingWatchlistUsers({
  userIds,
  auction,
}: {
  userIds: string[];
  auction: unknown;
}) {
  const connection = await amqp.connect(connectionString);
  const channel = await connection.createChannel();
  const exchange = "notification-exchange";

  await channel.assertExchange(exchange, "direct", {
    durable: true,
  });

  const message = JSON.stringify({
    eventType: "NOTIFY_WATCHLIST_MATCH",
    userIds,
    auction,
  });

  console.log("notifying watchlist users match");
  channel.publish(exchange, "watchlist.match", Buffer.from(message), {});

  await channel.close();
  await connection.close();
}

async function notifyNewBid({
  userIds,
  auction,
  bid,
}: {
  userIds: string[];
  auction: unknown;
  bid: unknown;
}) {
  const connection = await amqp.connect(connectionString);
  const channel = await connection.createChannel();
  const exchange = "notification-exchange";

  await channel.assertExchange(exchange, "direct", {
    durable: true,
  });

  const message = JSON.stringify({
    userIds,
    auction,
    bid,
    eventType: "NEW_BID",
  });

  channel.publish(exchange, "bid.new", Buffer.from(message), {});

  await channel.close();
  await connection.close();
}

export {
  scheduleAuction,
  scheduleTimeRemainingNotifications,
  notifyMatchingWatchlistUsers,
  notifyNewBid,
};
