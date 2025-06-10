# Use the full Go image for development
FROM golang:1.24-alpine

WORKDIR /app

# Install `air` for live-reloading
RUN go install github.com/air-verse/air@latest

# Copy dependency files and download them
COPY go.mod go.sum ./
RUN go mod download

# Expose the port
EXPOSE 8080

# The command to run. `air` will watch for file changes and re-run the server.
CMD ["air", "-c", ".air.toml", "-d"]
