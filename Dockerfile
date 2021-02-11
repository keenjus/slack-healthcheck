FROM node:alpine as build-stage
WORKDIR /work
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run bundle

FROM node:alpine as runtime-stage
COPY --from=build-stage /work/output /app

WORKDIR /app
CMD ["node", "index.js"]