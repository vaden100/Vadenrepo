# Media worker image (Fly.io / Render). Build from the repo root:
#   docker build -f apps/worker/Dockerfile -t rmmm-worker .
# ClamAV runs as its own service (clamav/clamav image); point CLAMAV_HOST at it.
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @rmmm/worker... && pnpm --filter @rmmm/worker build

FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/worker/dist ./dist
COPY --from=build /repo/apps/worker/package.json ./package.json
USER node
EXPOSE 8787
HEALTHCHECK CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
