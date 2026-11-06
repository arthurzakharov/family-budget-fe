# syntax=docker/dockerfile:1

FROM oven/bun:1.4-alpine AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml .npmrc ./
# The token (read by .npmrc) installs @arthurzakharov/family-budget-be-client from GitHub Packages.
# It is mounted as a build secret, so it never lands in an image layer.
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN="$(cat /run/secrets/github_token)" bun install --frozen-lockfile --production --ignore-scripts

FROM oven/bun:1.4-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# The server bundles src/client/index.html on startup, so it needs the sources and node_modules.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bunfig.toml tsconfig.json ./
COPY src ./src

USER bun
# The platform sets PORT; Bun.serve reads it (defaults to 3000).
EXPOSE 3000

CMD ["bun", "src/server/index.ts"]
