# Build Frontend
# Build Frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app/frontend
COPY package.json ./
# Remove lock files to ensure fresh install
RUN rm -f package-lock.json pnpm-lock.yaml bun.lockb
RUN npm install
COPY . .
RUN npm run build

# Build Backend
FROM node:20-alpine as backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .
RUN npx prisma generate
RUN npm run build

# Final Image
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/server/dist ./dist
COPY --from=backend-builder /app/server/package*.json ./
COPY --from=backend-builder /app/server/node_modules ./node_modules
COPY --from=backend-builder /app/server/prisma ./prisma

# Copy frontend build to public folder of backend (to be served statically)
COPY --from=frontend-builder /app/frontend/dist ./public

# Install production deps only (if needed, but we copied node_modules)
# RUN npm install --production

EXPOSE 3000

CMD ["node", "dist/index.js"]
