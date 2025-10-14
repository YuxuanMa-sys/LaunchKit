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

# Debug: Check what was actually built
RUN echo "Checking build output in /app/api:" && ls -la && echo "Checking for dist directory:" && find . -name "dist" -type d && echo "Checking for main.js:" && find . -name "main.js" -type f

# Copy built files to root for Railway (only if dist exists)
WORKDIR /app
RUN if [ -d "api/dist" ]; then cp -r api/dist ./dist; else echo "No api/dist found, checking current directory:" && ls -la; fi

# Verify build output
RUN echo "Final verification - checking dist directory:" && ls -la dist/ 2>/dev/null || echo "No dist directory found"

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/main.js"]
