FROM node:20-alpine
WORKDIR /app

# Install deps separately so layer is cached when only source changes
COPY package*.json ./
RUN npm ci --omit=dev

# Prisma needs the schema before generate
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/index.js"]
