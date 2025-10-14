FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package.json pnpm-lock.yaml ./
COPY api/package.json ./api/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY api/ ./api/

# Generate Prisma client and build
WORKDIR /app/api
RUN pnpm prisma generate
RUN pnpm run build

# Copy built files to root
WORKDIR /app
RUN cp -r api/dist ./dist

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/main.js"]
