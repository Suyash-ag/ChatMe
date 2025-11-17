#!/bin/bash

# Test Horizontal Scaling - Quick Script
# This script helps test multiple chat service instances

echo "🚀 Testing Horizontal Scaling"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if base services are running
echo -e "${YELLOW}Checking base services...${NC}"
if ! docker ps | grep -q mongo; then
    echo -e "${RED}MongoDB is not running. Starting services...${NC}"
    docker-compose up -d mongo redis
    sleep 5
fi

# Build chat service image
echo -e "${YELLOW}Building chat service image...${NC}"
docker build -t chatme-chat:latest ./backend/chat

# Get network name
NETWORK=$(docker network ls | grep chatme | awk '{print $1}' | head -1)
if [ -z "$NETWORK" ]; then
    NETWORK="chatme_chatme-network"
    docker network create $NETWORK 2>/dev/null
fi

# Stop existing chat instances
echo -e "${YELLOW}Cleaning up existing instances...${NC}"
docker stop chat-1 chat-2 2>/dev/null
docker rm chat-1 chat-2 2>/dev/null

# Start first instance
echo -e "${GREEN}Starting Chat Service Instance 1 (port 5001)...${NC}"
docker run -d \
  --name chat-1 \
  --network $NETWORK \
  -e PORT=5001 \
  -e MONGO_URI=mongodb://root:example@mongo:27017/chat?authSource=admin \
  -e REDIS_URL=redis://redis:6379 \
  -e JWT_SECRET=supersecretkey-change-in-production \
  -e CORS_ORIGIN=http://localhost:3000 \
  -e INSTANCE_ID=chat-instance-1 \
  -p 5001:5001 \
  chatme-chat:latest

sleep 2

# Start second instance
echo -e "${GREEN}Starting Chat Service Instance 2 (port 5002)...${NC}"
docker run -d \
  --name chat-2 \
  --network $NETWORK \
  -e PORT=5001 \
  -e MONGO_URI=mongodb://root:example@mongo:27017/chat?authSource=admin \
  -e REDIS_URL=redis://redis:6379 \
  -e JWT_SECRET=supersecretkey-change-in-production \
  -e CORS_ORIGIN=http://localhost:3000 \
  -e INSTANCE_ID=chat-instance-2 \
  -p 5002:5001 \
  chatme-chat:latest

sleep 3

# Check status
echo -e "${YELLOW}Checking instance status...${NC}"
echo ""
echo "Instance 1 logs:"
docker logs chat-1 --tail=5
echo ""
echo "Instance 2 logs:"
docker logs chat-2 --tail=5
echo ""

# Test health endpoints
echo -e "${YELLOW}Testing health endpoints...${NC}"
curl -s http://localhost:5001/health && echo " ✅ Instance 1 healthy"
curl -s http://localhost:5002/health && echo " ✅ Instance 2 healthy"

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Test Instructions:"
echo "1. Connect User 1 to: http://localhost:5001"
echo "2. Connect User 2 to: http://localhost:5002"
echo "3. Both join the same room"
echo "4. Send messages from User 1"
echo "5. Verify User 2 receives messages"
echo ""
echo "View logs:"
echo "  docker logs -f chat-1"
echo "  docker logs -f chat-2"
echo ""
echo "Stop instances:"
echo "  docker stop chat-1 chat-2"

