# Alpine(musl)보다 Debian에서 webpack/terser가 안정적인 경우가 많아 slim 사용
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG REACT_APP_API_URL=http://localhost:8080
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV GENERATE_SOURCEMAP=false
ENV CI=false
ENV DISABLE_ESLINT_PLUGIN=true
# 소형 EC2: 힙을 너무 크게 잡으면 스왑만 도는 경우가 있어 2~3GB대가 나은 경우 많음
ENV NODE_OPTIONS=--max-old-space-size=3072
RUN npm run build

FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

COPY --from=build /app/build ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
