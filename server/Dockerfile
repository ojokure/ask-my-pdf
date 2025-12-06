FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create directories for vector store and uploads
RUN mkdir -p vector_store uploads

EXPOSE 3001

CMD ["npm", "start"]

