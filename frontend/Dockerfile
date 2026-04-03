FROM node:20-slim

WORKDIR /app

# Install Expo CLI globally
RUN npm install -g expo-cli@latest

# Copy package files and install dependencies
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --network-timeout 300000

# Copy application code
COPY . .

EXPOSE 8081

CMD ["yarn", "web"]
