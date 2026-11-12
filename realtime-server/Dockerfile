# Multi-stage production Dockerfile for Railway deployment
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root prisma schemas for client generation
COPY prisma ./prisma

# Copy realtime-server package manifests
COPY realtime-server/package*.json ./realtime-server/
COPY realtime-server/tsconfig.json ./realtime-server/

WORKDIR /app/realtime-server
RUN npm ci

# Generate Prisma Client from PostgreSQL schema
RUN npx prisma generate --schema=../prisma/postgresql/schema.prisma

# Copy source code and build
COPY realtime-server/src ./src
RUN npm run build

# Runtime Stage
FROM node:22-alpine AS runner

WORKDIR /app/realtime-server
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Copy node_modules and built code
COPY --from=builder /app/realtime-server/node_modules ./node_modules
COPY --from=builder /app/realtime-server/dist ./dist
COPY --from=builder /app/realtime-server/package*.json ./
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 4000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/server.js"]

