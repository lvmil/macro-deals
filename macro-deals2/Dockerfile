# Playwright image has Chromium + deps preinstalled
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

WORKDIR /app

# Copy package files and install deps
# If you have package-lock.json, you can COPY it too, but not required.
COPY package.json ./
RUN npm install --no-audit --no-fund

# Copy the rest of the app
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runtime
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["npm", "start"]
