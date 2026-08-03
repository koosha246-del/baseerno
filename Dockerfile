# =================================================================
# Multi-stage Dockerfile for Next.js 15 (App Router) production
# =================================================================

# ---------- Dependencies stage ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies with a clean cache layer
# (prisma.config.ts is required by Prisma 7 CLI commands)
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client (outputs to src/generated/prisma per schema)
RUN npx prisma generate

# ---------- Builder stage ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Regenerate the Prisma client inside the full source tree
# (src/generated is gitignored, so COPY . . would wipe the deps copy)
RUN npx prisma generate

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ---------- Runner stage ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Prisma 7 generates the client to src/generated/prisma (not node_modules/.prisma)
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
