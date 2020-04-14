FROM node:latest as build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN rm .env

CMD ["node", "dist/index.js"]