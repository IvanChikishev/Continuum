FROM node:lts-bullseye-slim

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]
RUN npm install --production
COPY . .

CMD ["npm", "run", "start"]