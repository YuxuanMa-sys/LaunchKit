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
RUN echo "Before build - current directory contents:" && ls -la
RUN pnpm build
RUN echo "After build - current directory contents:" && ls -la
RUN echo "Looking for dist directory:" && find . -name "dist" -type d || echo "No dist directory found"
RUN echo "Looking for any .js files:" && find . -name "*.js" -type f || echo "No .js files found"

# Copy built files to root for Railway
WORKDIR /app
RUN echo "In /app directory, looking for api/dist:" && ls -la api/ 2>/dev/null || echo "No api directory found"
RUN if [ -d "api/dist" ]; then cp -r api/dist ./dist && echo "Successfully copied api/dist to dist"; else echo "api/dist does not exist, checking what's in api:" && ls -la api/; fi

# Verify build output
RUN echo "Final dist contents:" && ls -la dist/ 2>/dev/null || echo "No dist directory found"

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/main.js"]
