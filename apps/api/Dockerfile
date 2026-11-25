FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY . .
CMD ["npm", "run", "dev", "-w", "@neerapace/api"]

FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --omit=dev
COPY packages/shared packages/shared
COPY apps/api apps/api
USER node
EXPOSE 4000
CMD ["node", "apps/api/src/server.js"]
