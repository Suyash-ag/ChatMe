# Complete Testing Guide - ChatMe Application

This guide will walk you through running and testing the entire ChatMe application from start to finish.

## Prerequisites

Before starting, ensure you have:
- **Docker Desktop** installed and running (for Windows/Mac) or Docker Engine (for Linux)
- **Docker Compose** (usually comes with Docker Desktop)
- A modern web browser (Chrome, Firefox, Edge, etc.)
- At least 4GB of free RAM
- Ports 3000, 5000, 5001, 27017, and 6379 available

## Step 1: Navigate to Project Directory

```bash
cd ChatMe
```

## Step 2: Build and Start All Services

This will build Docker images and start all services (MongoDB, Redis, Auth Service, Chat Service, and Frontend).

```bash
docker-compose up --build
```

**What happens:**
- Docker will download base images (MongoDB, Redis, Node.js, Nginx)
- Build custom images for auth, chat, and frontend services
- Start all containers in the correct order
- Services will be available at:
  - Frontend: http://localhost:3000
  - Auth Service: http://localhost:5000
  - Chat Service: http://localhost:5001
  - MongoDB: localhost:27017
  - Redis: localhost:6379

**Wait for:** You should see logs indicating all services are running. Look for:
- `Auth service running on port 5000`
- `Chat service running on port 5001`
- `MongoDB connected`
- `Redis clients connected`

**Note:** The first build may take 5-10 minutes. Subsequent runs will be faster.

## Step 3: Verify Services Are Running

Open a new terminal and check if containers are running:

```bash
docker-compose ps
```

You should see 5 containers running:
- mongo
- redis
- auth
- chat
- frontend

## Step 4: Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

You should see the **Login** page.

## Step 5: Test User Registration

1. On the login page, click **"Register"** link (or navigate to http://localhost:3000/register)
2. Fill in the registration form:
   - **Username:** `testuser` (or any username you prefer)
   - **Password:** `testpass123` (or any password)
3. Click **"Register"** button
4. **Expected Result:** 
   - You should see "Registration successful!" message
   - After 1.5 seconds, you'll be redirected to the login page

## Step 6: Test User Login

1. On the login page, enter your credentials:
   - **Username:** `testuser` (the one you just registered)
   - **Password:** `testpass123`
2. Click **"Login"** button
3. **Expected Result:**
   - You should be redirected to the chat room page
   - You'll see "Chat Room: general" at the top
   - The room input field showing "general"
   - An empty message area
   - A message input field at the bottom

## Step 7: Test Real-Time Chat

### Test 1: Send a Message

1. In the message input field at the bottom, type: `Hello, this is my first message!`
2. Click **"Send"** button (or press Enter)
3. **Expected Result:**
   - Your message should appear in the chat area
   - Format: `testuser: Hello, this is my first message!`
   - The input field should be cleared

### Test 2: Test Multiple Messages

1. Send a few more messages:
   - `Testing real-time chat`
   - `This is working great!`
   - `Can anyone see this?`
2. **Expected Result:**
   - All messages should appear in chronological order
   - Each message shows your username

### Test 3: Test Room Switching

1. In the "Room" input field (at the top), change `general` to `tech`
2. Click outside the field or press Enter
3. **Expected Result:**
   - The room name changes to "tech"
   - The message area clears (new room, no previous messages)
   - You can now send messages to the "tech" room

4. Send a message: `Hello tech room!`
5. Switch back to `general` room
6. **Expected Result:**
   - Room switches back to "general"
   - Messages from "tech" room are not visible (different room)

### Test 4: Test Multiple Users (Advanced)

To test with multiple users, open a **second browser window** (or use incognito/private mode):

1. **In the first browser:**
   - You should already be logged in as `testuser`
   - Stay in the `general` room

2. **In the second browser:**
   - Navigate to http://localhost:3000
   - Register a new user: `user2` with password `pass123`
   - Login with `user2`
   - Join the `general` room

3. **Test real-time messaging:**
   - In the first browser, send: `Hello from user1!`
   - **Expected:** Both browsers should see the message
   - In the second browser, send: `Hello from user2!`
   - **Expected:** Both browsers should see this message too

4. **Test room isolation:**
   - In the first browser, switch to room `tech`
   - In the second browser, stay in `general`
   - Send messages from both browsers
   - **Expected:** Messages only appear in their respective rooms

## Step 8: Test API Endpoints (Optional)

You can test the backend APIs directly using curl or Postman:

### Test Auth Service Health
```bash
curl http://localhost:5000/health
```
**Expected:** `{"status":"ok","service":"auth"}`

### Test Chat Service Health
```bash
curl http://localhost:5001/health
```
**Expected:** `{"status":"ok","service":"chat"}`

### Test Registration API
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"apitest","password":"test123"}'
```
**Expected:** `{"message":"User registered successfully"}`

### Test Login API
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"apitest","password":"test123"}'
```
**Expected:** `{"token":"eyJhbGc...","username":"apitest"}`

## Step 9: View Logs (For Debugging)

To see what's happening behind the scenes:

```bash
# View all logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f auth
docker-compose logs -f chat
docker-compose logs -f frontend
```

## Step 10: Stop the Application

When you're done testing:

```bash
# Stop all services (containers still exist)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, and remove volumes (clears database)
docker-compose down -v
```

## Troubleshooting

### Issue: Port already in use
**Solution:** 
- Check if ports 3000, 5000, 5001, 27017, or 6379 are already in use
- Stop the conflicting service or change ports in `docker-compose.yml`

### Issue: Cannot connect to services
**Solution:**
- Ensure Docker Desktop is running
- Check if all containers are running: `docker-compose ps`
- Check logs: `docker-compose logs`

### Issue: Frontend shows connection errors
**Solution:**
- Wait a few seconds for all services to start
- Check browser console (F12) for errors
- Verify backend services are running: `curl http://localhost:5000/health`

### Issue: Messages not appearing in real-time
**Solution:**
- Check if Redis is running: `docker-compose logs redis`
- Check chat service logs: `docker-compose logs chat`
- Verify WebSocket connection in browser DevTools (Network tab)

### Issue: Registration/Login fails
**Solution:**
- Check MongoDB is running: `docker-compose logs mongo`
- Check auth service logs: `docker-compose logs auth`
- Try clearing browser cache and localStorage

### Issue: Need to reset everything
**Solution:**
```bash
# Stop and remove everything including volumes
docker-compose down -v

# Remove all images (optional)
docker-compose down --rmi all

# Start fresh
docker-compose up --build
```

## Testing Checklist

- [ ] All services start successfully
- [ ] Can access frontend at http://localhost:3000
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] Can send messages in chat
- [ ] Messages appear in real-time
- [ ] Can switch between rooms
- [ ] Messages are isolated by room
- [ ] Multiple users can chat simultaneously
- [ ] Messages persist (refresh page, messages still there)

## Next Steps

Once basic testing is complete, you can test advanced scenarios:

1. **Test horizontal scaling** (run multiple chat service instances)
   - See: [ADVANCED_TESTING_GUIDE.md](./ADVANCED_TESTING_GUIDE.md#1-horizontal-scaling-testing)
   - Quick script: `./scripts/test-horizontal-scaling.sh`

2. **Test with Kubernetes deployment**
   - See: [ADVANCED_TESTING_GUIDE.md](./ADVANCED_TESTING_GUIDE.md#2-kubernetes-deployment-testing)

3. **Test the CI/CD pipeline**
   - See: [ADVANCED_TESTING_GUIDE.md](./ADVANCED_TESTING_GUIDE.md#3-cicd-pipeline-testing)

4. **Load test with multiple concurrent users**
   - See: [ADVANCED_TESTING_GUIDE.md](./ADVANCED_TESTING_GUIDE.md#4-load-testing-with-multiple-users)
   - Quick script: `k6 run scripts/load-test.js`

5. **Test error scenarios** (network failures, service restarts)
   - See: [ADVANCED_TESTING_GUIDE.md](./ADVANCED_TESTING_GUIDE.md#5-error-scenarios-testing)
   - Quick script: `./scripts/test-error-scenarios.sh`

**📖 For detailed instructions, see [ADVANCED_TESTING_GUIDE.md](./ADVANCED_TESTING_GUIDE.md)**

## Additional Notes

- **Data Persistence:** Messages and users are stored in MongoDB and persist between container restarts
- **Development Mode:** For development, you can run services individually (see README.md)
- **Production:** Update JWT_SECRET and MongoDB credentials before deploying to production
- **Scaling:** The chat service supports horizontal scaling via Redis pub/sub

---

**Happy Testing! 🚀**

