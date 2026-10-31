# ==========================================
# Shoes4Us Go Backend - Production Dockerfile
# Multi-stage build for minimal attack surface and size (~25MB)
# ==========================================

# ------------------------------------------
# Stage 1: Build Binaries
# ------------------------------------------
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install ca-certificates and tzdata for building & fetching deps
RUN apk add --no-cache git ca-certificates tzdata

# Cache Go modules layer
COPY go.mod go.sum ./
RUN go mod download

# Copy application source code
COPY . .

# Build static CGO-disabled production binaries for API and Database Seeder
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w" \
    -trimpath \
    -o /app/bin/api ./cmd/api

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w" \
    -trimpath \
    -o /app/bin/seed ./cmd/seed

# ------------------------------------------
# Stage 2: Minimal Runtime
# ------------------------------------------
FROM alpine:3.20 AS runner

WORKDIR /app

# Install root CA certificates and timezone data
RUN apk add --no-cache ca-certificates tzdata

# Create dedicated unprivileged user & group (UID/GID 10001)
RUN addgroup -S -g 10001 appgroup && \
    adduser -S -u 10001 -G appgroup -h /app -s /sbin/nologin appuser

# Create persistent storage directories
RUN mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app

# Copy compiled binaries from builder stage
COPY --from=builder --chown=appuser:appgroup /app/bin/api /app/api
COPY --from=builder --chown=appuser:appgroup /app/bin/seed /app/seed

# Set default production environment variables
ENV PORT=8080 \
    UPLOAD_DIR=/app/uploads

# Run as non-root user
USER appuser:appgroup

# Expose Go API HTTP Port
EXPOSE 8080

# Health check using the /api/health probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start the API server by default
CMD ["/app/api"]
