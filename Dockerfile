# Use the official Node.js LTS image as the base
FROM node:22.8.0

# Set working directory
WORKDIR /app

# Copy package.json and lock files
COPY package.json ./

# Install production dependencies
RUN npm install

# Copy the rest of the source code

COPY . .
COPY .env .

# Generate Prisma client
RUN npx prisma generate

# Expose the service's port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start"]
