import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

async function findUsersByUserId(watchlistUsers: any[]) {
  const matchedUsers = [];

  for (const user of watchlistUsers) {
    try {
      // Query Cognito by email
      const command = new AdminGetUserCommand({
        UserPoolId: process.env.AWS_COGNITO_USERPOOL_ID,
        Username: user.userId, // Use `sub` or `username`
      });

      const response = await cognitoClient.send(command);

      if (response) {
        // Extract attributes
        const attributes = response.UserAttributes;

        // Find the email attribute
        const emailAttribute = attributes?.find(
          (attr) => attr.Name === "email",
        );
        const email = emailAttribute?.Value;

        matchedUsers.push(email);
        console.log(matchedUsers);
      }
    } catch (error) {
      console.error(`Error fetching the email for ${user.userId}`);

      console.error(error);
    }
  }

  return matchedUsers;
}

export { cognitoClient, findUsersByUserId };
