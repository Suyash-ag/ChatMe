# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build-time environment variables (can be overridden with --build-arg)
ARG REACT_APP_AUTH_API_URL=http://localhost:5000/auth
ARG REACT_APP_CHAT_API_URL=http://localhost:5001
ENV REACT_APP_AUTH_API_URL=$REACT_APP_AUTH_API_URL
ENV REACT_APP_CHAT_API_URL=$REACT_APP_CHAT_API_URL
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]