# Stage 1: build the Go binary
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# Stage 2: produce minimal runtime image
FROM gcr.io/distroless/static
COPY --from=builder /app/server /server
EXPOSE 8080
COPY --from=builder /app/config/app.yaml /config/app.yaml
ENTRYPOINT ["/server"]