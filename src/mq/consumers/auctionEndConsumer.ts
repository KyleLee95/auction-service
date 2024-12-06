import {
  endAuction,
  setupExchange,
  sendAuctionDataToCartService,
  createChannel,
  setupQueue,
} from "../rabbitmq";

export async function endAuctionConsumer(exchange: string, queue: string) {
  const { channel } = await createChannel();

  await setupExchange(channel, exchange, "x-delayed-message", {
    durable: true,
    arguments: { "x-delayed-type": "direct" },
  });

  await setupQueue(channel, queue, exchange, "auction.end");

  channel.consume(queue, async (msg) => {
    if (msg) {
      const { auctionId } = JSON.parse(msg.content.toString());
      try {
        const auctionData = await endAuction(auctionId);
        console.log(`Ended auction ${auctionId} successfully.`);
        await sendAuctionDataToCartService(auctionData);
      } catch (error) {
        console.error(`Failed to end auction ${auctionId}:`, error.message);
      }
      channel.ack(msg);
    }
  });

  console.log(`Listening for auction end messages on queue ${queue}`);
}
