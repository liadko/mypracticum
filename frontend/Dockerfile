# Use an official Node.js image.
FROM node:20-alpine

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json and lock files.
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy the rest of your source code.
# This ensures the container has the files if the volume mount is slow to initialize.
COPY . .

# Expose the port Vite runs on.
EXPOSE 5173

# The command to start the Vite development server.
CMD ["npm", "run", "dev"]
