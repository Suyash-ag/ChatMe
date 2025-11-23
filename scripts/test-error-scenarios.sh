#!/bin/bash

# Error Scenarios Testing Script
# Tests various error conditions

echo "🧪 Testing Error Scenarios"
echo "=========================="

BASE_URL="http://localhost:5000"
CHAT_URL="http://localhost:5001"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}Test 1: Invalid Registration${NC}"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "500" ]; then
    echo -e "${GREEN}✅ Correctly rejected invalid request (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Unexpected response (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo -e "${YELLOW}Test 2: Duplicate Registration${NC}"
echo "-----------------------------------"
# Register first time
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"duplicate_test","password":"test123"}' > /dev/null

# Try to register again
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"duplicate_test","password":"test123"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}✅ Correctly rejected duplicate user (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Unexpected response (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo -e "${YELLOW}Test 3: Invalid Login${NC}"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nonexistent","password":"wrong"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}✅ Correctly rejected invalid credentials (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Unexpected response (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo -e "${YELLOW}Test 4: Missing Token${NC}"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/auth/profile)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✅ Correctly rejected request without token (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Unexpected response (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo -e "${YELLOW}Test 5: Invalid Token${NC}"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer invalid-token-12345" \
  $BASE_URL/auth/profile)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✅ Correctly rejected invalid token (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Unexpected response (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo -e "${YELLOW}Test 6: Health Check${NC}"
echo "-----------------------------------"
RESPONSE=$(curl -s $BASE_URL/health)
if echo "$RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check working${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi

echo ""
echo -e "${YELLOW}Test 7: Service Restart Simulation${NC}"
echo "-----------------------------------"
echo "Stopping auth service for 5 seconds..."
docker stop auth
sleep 5
echo "Starting auth service..."
docker start auth
sleep 3

RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/health)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Service recovered after restart${NC}"
else
    echo -e "${RED}❌ Service did not recover (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Error scenario tests complete!${NC}"

