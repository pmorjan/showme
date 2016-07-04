FROM alpine:latest

COPY package.json app.js /app/

RUN apk add --no-cache python g++ make nodejs openssh-client bash \
    && cd /app \
    && npm install \
    && rm -rf /usr/lib/node_modules/npm \
    && rm -rf /root/.node-gyp \
    && rm -rf /root/.npm \
    && apk del --rdepends --purge python g++ make \
    && adduser -D -s /bin/bash app \
    && echo . /etc/profile.d/color_prompt > /home/app/.bashrc

ENV NODE_ENV production

USER app

WORKDIR /home/app

CMD ["node", "/app/app.js"]

