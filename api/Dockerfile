FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

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

# Copy built files to root for Railway
WORKDIR /app
RUN cp -r api/dist ./dist

# Verify build output
RUN echo "Build completed, checking dist directory:" && ls -la dist/ && echo "Main file exists:" && ls -la dist/main.js

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/main.js"]
