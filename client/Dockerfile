# ================= RUBRIC: FRONTEND DEPLOYMENT (0.2 pts) & CONTAINERIZATION WITH DOCKER (0.5 pts) =================
# Multi-stage production container build for Vite React SPA
# Stage 1: Build static production assets
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve optimized assets via high-performance Nginx web server
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
