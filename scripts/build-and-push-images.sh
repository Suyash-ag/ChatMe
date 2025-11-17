#!/bin/bash

# Build and Push Docker Images to DockerHub
# Usage: ./scripts/build-and-push-images.sh

set -e

DOCKERHUB_USERNAME="suyashag"

echo "🐳 Building and Pushing Docker Images"
echo "======================================"
echo "DockerHub Username: $DOCKERHUB_USERNAME"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker.${NC}"
    exit 1
fi

# Check if logged in to DockerHub
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}⚠️  Not logged in to DockerHub. Logging in...${NC}"
    docker login
fi

# Build Auth Service
echo -e "${GREEN}📦 Building Auth Service...${NC}"
docker build -t $DOCKERHUB_USERNAME/chatme-auth:latest ./backend/auth
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Auth Service built successfully${NC}"
else
    echo -e "${RED}❌ Auth Service build failed${NC}"
    exit 1
fi

# Build Chat Service
echo -e "${GREEN}📦 Building Chat Service...${NC}"
docker build -t $DOCKERHUB_USERNAME/chatme-chat:latest ./backend/chat
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chat Service built successfully${NC}"
else
    echo -e "${RED}❌ Chat Service build failed${NC}"
    exit 1
fi

# Build Frontend
echo -e "${GREEN}📦 Building Frontend...${NC}"
docker build \
  --build-arg REACT_APP_AUTH_API_URL=http://auth:5000/auth \
  --build-arg REACT_APP_CHAT_API_URL=ws://chat:5001 \
  -t $DOCKERHUB_USERNAME/chatme-frontend:latest ./frontend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Push Auth Service
echo -e "${GREEN}📤 Pushing Auth Service...${NC}"
docker push $DOCKERHUB_USERNAME/chatme-auth:latest
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Auth Service pushed successfully${NC}"
else
    echo -e "${RED}❌ Auth Service push failed${NC}"
    exit 1
fi

# Push Chat Service
echo -e "${GREEN}📤 Pushing Chat Service...${NC}"
docker push $DOCKERHUB_USERNAME/chatme-chat:latest
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chat Service pushed successfully${NC}"
else
    echo -e "${RED}❌ Chat Service push failed${NC}"
    exit 1
fi

# Push Frontend
echo -e "${GREEN}📤 Pushing Frontend...${NC}"
docker push $DOCKERHUB_USERNAME/chatme-frontend:latest
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend pushed successfully${NC}"
else
    echo -e "${RED}❌ Frontend push failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All images built and pushed successfully!${NC}"
echo ""
echo "Images available at:"
echo "  - $DOCKERHUB_USERNAME/chatme-auth:latest"
echo "  - $DOCKERHUB_USERNAME/chatme-chat:latest"
echo "  - $DOCKERHUB_USERNAME/chatme-frontend:latest"
echo ""
echo "You can now deploy to Kubernetes:"
echo "  kubectl apply -f k8s/"

