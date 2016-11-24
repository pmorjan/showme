FROM alpine:latest

COPY package.json app.js /app/

ENV NODE_ENV production

RUN apk update \
    && apk add --no-cache python g++ make nodejs openssh-client bash tini \
    && cd /app \
    && npm install \
    && rm -rf /usr/lib/node_modules/npm \
    && rm -rf /root/.node-gyp \
    && rm -rf /root/.npm \
    && apk del --rdepends --purge python g++ make \
    && adduser -D -s /bin/bash app \
    && echo . /etc/profile.d/color_prompt > /home/app/.bashrc \
    && chown app:app /home/app/.bashrc

USER app

WORKDIR /home/app

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "/app/app.js"]

