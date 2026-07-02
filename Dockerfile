FROM node:20-alpine

WORKDIR /app

# Install backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Install frontend deps and build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy backend source
COPY backend/ ./backend/

# Generate Prisma client
RUN cd backend && npx prisma generate

# Expose port
EXPOSE 5000

WORKDIR /app/backend

CMD ["npx", "tsx", "src/index.ts"]
