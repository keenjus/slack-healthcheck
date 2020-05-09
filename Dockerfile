FROM node:alpine as build-stage
WORKDIR /work
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build
RUN npm prune --production

FROM node:alpine as runtime-stage
COPY --from=build-stage /work/dist /app
COPY --from=build-stage /work/node_modules/ /app/node_modules/

WORKDIR /app
CMD ["node", "index.js"]