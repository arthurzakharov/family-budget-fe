# syntax=docker/dockerfile:1

FROM oven/bun:1.4-alpine AS deps
WORKDIR /app
# Needed only to install @arthurzakharov/family-budget-be-client from GitHub Packages
# (.npmrc reads it). It stays in this stage and never reaches the runtime image.
ARG GITHUB_TOKEN
COPY package.json bun.lock bunfig.toml .npmrc ./
RUN GITHUB_TOKEN="$GITHUB_TOKEN" bun install --frozen-lockfile --production --ignore-scripts

FROM oven/bun:1.4-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# The server bundles src/client/index.html on startup, so it needs the sources and node_modules.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bunfig.toml tsconfig.json ./
COPY src ./src

USER bun
# Render sets PORT; Bun.serve reads it (defaults to 3000).
EXPOSE 3000

CMD ["bun", "src/server/index.ts"]
