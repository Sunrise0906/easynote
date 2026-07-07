# ── EasyNote production image ───────────────────────────────────────
# Multi-stage build producing a small standalone Next.js server.
# Runtime data (accounts, notes, uploads) lives in /data — mount a
# volume there to persist it across deploys.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/data

# su-exec lets the entrypoint fix volume ownership as root, then drop
# privileges to the unprivileged `app` user before exec'ing the server.
RUN apk add --no-cache su-exec \
    && addgroup -S app && adduser -S app -G app \
    && mkdir -p /data

COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh

EXPOSE 3000
VOLUME ["/data"]

# Probe the port the server actually binds to (PORT may be injected by the
# platform, e.g. Railway), not a hardcoded 3000.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const p=process.env.PORT||3000;fetch('http://127.0.0.1:'+p+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
