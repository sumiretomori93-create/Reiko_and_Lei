FROM node:24-alpine
WORKDIR /app
COPY package.json *.mjs ./
COPY public ./public
RUN mkdir -p /data && chown node:node /data
USER node
ENV DATA_DIR=/data PORT=8080
EXPOSE 8080
CMD ["node","server.mjs"]
