FROM node:24-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy only the packages and apps needed
COPY packages/shared/ packages/shared/
COPY packages/db/ packages/db/
COPY apps/ws/ apps/ws/

# Install dependencies
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/ws
EXPOSE 8080
CMD ["npx", "tsx", "index.ts"]
