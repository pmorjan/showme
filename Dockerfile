FROM alpine:latest

RUN mkdir -p /app

COPY package.json app.js /app/

RUN adduser -D -s /bin/bash app

RUN apk add --no-cache nodejs openssh-client bash

RUN apk add --no-cache python g++ make \
    && cd /app \
    && npm install \
    && apk del --no-cache --rdepends --purge python g++ make

ENV NODE_ENV production

USER app

RUN echo . /etc/profile.d/color_prompt > /home/app/.bashrc

WORKDIR /home/app

CMD ["node", "/app/app.js"]

