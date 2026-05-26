FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx tsc -p tsconfig.build.json
RUN ls -la dist/ || echo "ERRO: pasta dist nao foi criada"
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
