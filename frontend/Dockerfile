FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# RUN npm init -y >/dev/null 2>&1 && npm install --omit=dev http-server@14.1.1 && rm package.json package-lock.json

COPY --from=builder /app/build ./build

EXPOSE 3000
CMD ["npx", "http-server", "build", "-p", "3000", "-a", "0.0.0.0"]
