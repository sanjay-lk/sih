FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production=false
COPY tsconfig.json ./
COPY src ./src
RUN npm run build || yarn build
ENV NODE_ENV=production
CMD ["npm","start"]


