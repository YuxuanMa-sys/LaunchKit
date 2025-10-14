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
RUN echo "Generating Prisma client..." && pnpm prisma generate
RUN echo "Building application..." && pnpm run build
RUN echo "Build completed, listing dist contents:" && ls -la dist/

# Copy built files to root
WORKDIR /app
RUN echo "Copying dist to root..." && cp -r api/dist ./dist
RUN echo "Final root directory contents:" && ls -la

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/main.js"]
