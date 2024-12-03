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

// async function notifyTimeRemaining(auctionData, users) {
//eventType: "AUCTION_TIME_REMANING"
// }

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

export { scheduleAuction, notifyMatchingWatchlistUsers, notifyNewBid };
