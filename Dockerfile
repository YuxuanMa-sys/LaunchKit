# Multi-stage build for LaunchKit
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY api/package.json ./api/
COPY app/package.json ./app/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install pnpm
RUN npm install -g pnpm

# Generate Prisma client
RUN cd api && pnpm prisma generate

# Build the API
RUN cd api && pnpm build

# Build the frontend
RUN cd app && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built applications
COPY --from=builder /app/app/.next/standalone ./
COPY --from=builder /app/app/.next/static ./app/.next/static
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/api/node_modules ./api/node_modules
COPY --from=builder /app/api/package.json ./api/

# Copy Prisma files
COPY --from=builder /app/api/prisma ./api/prisma

USER nextjs

EXPOSE 3000 3001

# Start both services
CMD ["sh", "-c", "cd api && node dist/main.js & cd ../app && node server.js"]
