FROM node:argon

RUN mkdir -p /app

WORKDIR /app

COPY package.json app.js /app/

RUN npm install

RUN useradd -m app

USER app

CMD ["npm", "start"]
