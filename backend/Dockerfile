FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
EXPOSE 8080

CMD ["sh", "-c", "npx prisma generate && npx prisma db push --url \"$DATABASE_URL\" && node src/index.js"]
