FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Cache busting - force fresh build
RUN echo "Build timestamp: $(date)" > /tmp/build-timestamp

# Set working directory
WORKDIR /app

# Copy all files (Railway builds from root)
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client and build
WORKDIR /app/api
RUN echo "Generating Prisma client..." && pnpm prisma generate
RUN echo "Listing all files in current directory..." && ls -la
RUN echo "Looking for tsconfig.json..." && find . -name "tsconfig.json"
RUN echo "Building application with TypeScript..." && echo "Current directory: $(pwd)" && (npx tsc --verbose || echo "TypeScript compilation failed, checking for errors...")
RUN echo "Checking if dist was created..." && ls -la dist/ 2>/dev/null || echo "No dist directory found"
RUN echo "Build completed, listing current directory:" && ls -la
RUN echo "Looking for any compiled files..." && find . -name "*.js" -type f
RUN echo "Looking for dist directory..." && find . -name "dist" -type d

# Copy built files to root (if they exist)
WORKDIR /app
RUN echo "Copying dist to root..." && (cp -r api/dist ./dist || echo "No dist directory found")
RUN echo "Final root directory contents:" && ls -la

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/main"]
