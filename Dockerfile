# Use Node LTS as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) if they exist
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the React app
RUN npm run build

# Install a lightweight HTTP server to serve the build
RUN npm install -g serve

# Expose port
EXPOSE 3500

# Command to run the app
CMD ["serve", "-s", "build", "-l", "3500"]

