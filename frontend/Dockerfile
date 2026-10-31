# ==========================================
# Shoes4Us React Frontend - Production Dockerfile
# Multi-stage build: Vite build -> Nginx Alpine
# ==========================================

# ------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (cached)
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build argument for API base URL (default relative /api for reverse proxy)
ARG VITE_API_URL="/api"
ENV VITE_API_URL=${VITE_API_URL}

# Run TypeScript compilation and Vite production bundle
RUN npm run build

# ------------------------------------------
# Stage 2: Production Nginx Server
# ------------------------------------------
FROM nginx:1.27-alpine AS runner

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration with SPA fallback & reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/healthz || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
