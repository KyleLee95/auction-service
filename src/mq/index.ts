import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
// The AWS Region can be provided here using the `region` property. If you leave it blank
// the SDK will default to the region set in your AWS config.
export const snsClient = new SNSClient({
  region: "us-east-2",
});

export const publish = async () => {
  const test_message = "Hello from auctions service";
  const test_topicArn = "arn:aws:sns:us-east-2:010928228447:test";
  const response = await snsClient.send(
    new PublishCommand({
      Message: test_message,
      TopicArn: test_topicArn,
    }),
  );

  console.log(response);
  return response;
};
