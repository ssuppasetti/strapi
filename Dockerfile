FROM node:20-alpine

WORKDIR /opt/app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 1337

CMD ["npm", "run", "start"]
