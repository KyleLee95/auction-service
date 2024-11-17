import amqp from "amqplib";

amqp.connect("amqp://localhost", function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    const exchange = "auctions";
    interface MQMessageType {
      event: string;
      data: [];
    }
    const msg: MQMessageType = {
      event: "AUCTION_CLOSE",
      data: [],
    };

    channel.assertExchange(exchange, "direct", {
      durable: false,
    });
    channel.publish(exchange, Buffer.from(JSON.stringify(msg)));
    console.log(" [x] Sent %s: '%s'", msg);
  });

  setTimeout(function () {
    connection.close();
    process.exit(0);
  }, 500);
});
