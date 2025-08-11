# Use Playwright image with all Chromium deps preinstalled
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm ci

# Copy the rest of the app
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runtime
ENV NODE_ENV=production
# Render provides PORT; Next.js uses it if set
ENV PORT=10000
EXPOSE 10000

CMD ["npm", "start"]
