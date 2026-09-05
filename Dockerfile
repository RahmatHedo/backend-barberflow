# =============================================
# Production image - single stage, lean & deployable
# =============================================
FROM node:20-alpine

# Node bumps to production mode = install prod deps only
ENV NODE_ENV=production

WORKDIR /app

# Install deps first (cache-friendly: only re-runs when package.json changes)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY src ./src

# Non-root user (best practice)
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 5000

CMD ["node", "src/app.js"]