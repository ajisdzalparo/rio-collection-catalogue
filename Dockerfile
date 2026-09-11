# Multi-stage Dockerfile for RIO Collection Catalogue
# Optimized for Next.js standalone mode and separated external PostgreSQL database

# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Install libc6-compat for alpine compatibility
RUN apk add --no-cache libc6-compat openssl

# Copy package management files and Prisma schema
COPY package.json bun.lock ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for frontend NEXT_PUBLIC_* variables
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Dummy environment variables required during build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rio_collection?schema=public"

# Generate Prisma Client for linux targets
RUN bun x prisma generate

# Build Next.js app in standalone mode
RUN bun run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install openssl & curl for healthcheck and Prisma runtime
RUN apk add --no-cache openssl curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# Health check to ensure application is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

CMD ["node", "server.js"]
