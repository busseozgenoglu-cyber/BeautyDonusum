FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --network-timeout 300000

# Copy application code
COPY . .

EXPOSE 8081

CMD ["npx", "expo", "start", "--web", "--port", "8081", "--non-interactive"]
