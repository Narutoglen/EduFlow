# EduFlow web (Next.js 16) — multi-stage, non-root.
# Frontend agent owns refinements (e.g. output:'standalone'); this is the M0 baseline.
# NOTE (Security S1): pin base image by digest before sign-off.
FROM node:22-slim@sha256:32b9e321f262db540d55ac10dc529667cf4737546e097cdd36a843c62bcbf423 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim@sha256:32b9e321f262db540d55ac10dc529667cf4737546e097cdd36a843c62bcbf423 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time only: prisma.config.ts resolves env("DATABASE_URL") at load, but `prisma generate` and
# `next build` need no real DB. The real DATABASE_URL is injected at runtime by compose (overrides this).
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run prisma:generate && npm run build

FROM node:22-slim@sha256:32b9e321f262db540d55ac10dc529667cf4737546e097cdd36a843c62bcbf423 AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10002 webuser
# --chown at copy time avoids a slow recursive chown over node_modules.
COPY --from=build --chown=webuser:webuser /app/.next ./.next
COPY --from=build --chown=webuser:webuser /app/node_modules ./node_modules
COPY --from=build --chown=webuser:webuser /app/public ./public
COPY --from=build --chown=webuser:webuser /app/package.json ./package.json
COPY --from=build --chown=webuser:webuser /app/prisma ./prisma
USER webuser

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
    CMD curl -fsS http://localhost:3000/ || exit 1
CMD ["npm", "run", "start"]
