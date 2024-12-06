import {
  createChannel,
  setupExchange,
  setupQueue,
  toggleAuctionActiveStatus,
} from "../rabbitmq";

export async function startAuctionConsumer(exchange: string, queue: string) {
  const { channel } = await createChannel();
  await setupExchange(channel, exchange, "x-delayed-message", {
    durable: true,
    arguments: { "x-delayed-type": "direct" },
  });
  await setupQueue(channel, queue, exchange, "auction.start");

  channel.consume(queue, async (msg) => {
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

  console.log(`Listening for auction start messages on queue ${queue}`);
}
