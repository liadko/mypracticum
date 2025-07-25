# ── 1. Build Stage ──
FROM golang:1.20-alpine AS builder
WORKDIR /app

# Cache modules
COPY go.mod go.sum ./
RUN go mod download

# Copy everything and build
COPY . .
# Build a statically-linked binary named "server"
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -o server main.go

# ── 2. Final Stage ──
FROM gcr.io/distroless/static:nonroot
WORKDIR /app

# Copy the binary
COPY --from=builder /app/server .

# Cloud Run expects your app to listen on $PORT (default 8080)
ENV PORT 8080
EXPOSE 8080

# Run as non-root user for security
USER nonroot:nonroot

# Launch the server
CMD ["/app/server"]
