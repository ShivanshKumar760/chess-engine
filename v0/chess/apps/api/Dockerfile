FROM node:24-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy only the packages and apps needed
COPY packages/shared/ packages/shared/
COPY packages/db/ packages/db/
COPY apps/api/ apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["npx", "tsx", "index.ts"]
