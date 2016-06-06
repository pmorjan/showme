FROM node:argon

RUN mkdir -p /app

WORKDIR /app

COPY package.json app.js /app/

RUN npm install

CMD ["npm", "start"]
