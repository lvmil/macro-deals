FROM mcr.microsoft.com/playwright:v1.50.0-jammy
# if that tag doesn’t exist yet, use:  FROM mcr.microsoft.com/playwright:latest
WORKDIR /app

COPY package.json ./
# If you have a lockfile, uncomment:
# COPY package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["npm", "start"]
