FROM node:18-alpine

# Install pnpm and OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev && npm install -g pnpm


# Set working directory
WORKDIR /app

# Copy all files (Railway builds from root)
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client and build
WORKDIR /app/api
RUN pnpm prisma generate
RUN pnpm build

# Verify build output
WORKDIR /app
RUN echo "Build completed successfully. Dist contents:" && ls -la dist/

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/main.js"]
