# Playwright image (Chromium + fonts + Linux deps preinstalled)
# v1.47.0 ships with a newer Node that satisfies cheerio/undici engine ranges
FROM mcr.microsoft.com/playwright:v1.47.0-jammy

# Create app dir
WORKDIR /app

# Copy only package file(s) first to leverage Docker layer caching
COPY package.json ./
# If you have a lockfile, uncomment the next line too:
# COPY package-lock.json ./

# Install dependencies (no audit/fund spam)
RUN npm install --no-audit --no-fund

# Copy the rest of the app
COPY . .

# Build Next.js (disable telemetry to keep logs clean)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runtime env
ENV NODE_ENV=production
# Render sets PORT; Next.js will honor it
ENV PORT=10000
EXPOSE 10000

# Start app
CMD ["npm", "start"]
