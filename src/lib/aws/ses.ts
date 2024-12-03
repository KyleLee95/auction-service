import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Load environment variables
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function sendEmail(to: string, subject: string, body: string) {
  try {
    const params = {
      Destination: {
        ToAddresses: [to], // Recipient email
      },
      Message: {
        Body: {
          Text: { Data: body }, // Plain text body
          Html: { Data: `<p>${body}</p>` }, // HTML body
        },
        Subject: { Data: subject },
      },
      Source: process.env.SENDER_EMAIL!, // Verified sender email
    };

    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);

    console.log("Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
export { sendEmail, sesClient };
