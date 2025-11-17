# Advanced Testing Guide

This guide covers advanced testing scenarios for the ChatMe application.

## Table of Contents
1. [Horizontal Scaling Testing](#1-horizontal-scaling-testing)
2. [Kubernetes Deployment Testing](#2-kubernetes-deployment-testing)
3. [CI/CD Pipeline Testing](#3-cicd-pipeline-testing)
4. [Load Testing with Multiple Users](#4-load-testing-with-multiple-users)
5. [Error Scenarios Testing](#5-error-scenarios-testing)

---

## 1. Horizontal Scaling Testing

### Objective
Test that multiple chat service instances can handle messages correctly using Redis pub/sub.

### Prerequisites
- Docker Compose running
- Understanding of how Redis pub/sub works

### Steps

#### Step 1: Start Base Services
```bash
docker-compose up -d mongo redis
```

#### Step 2: Start Multiple Chat Service Instances

**Terminal 1 - Chat Service Instance 1:**
```bash
docker run -d \
  --name chat-1 \
  --network chatme_chatme-network \
  -e PORT=5001 \
  -e MONGO_URI=mongodb://root:example@mongo:27017/chat?authSource=admin \
  -e REDIS_URL=redis://redis:6379 \
  -e JWT_SECRET=supersecretkey-change-in-production \
  -e CORS_ORIGIN=http://localhost:3000 \
  -e INSTANCE_ID=chat-instance-1 \
  -p 5001:5001 \
  chatme-chat:latest
```

**Terminal 2 - Chat Service Instance 2:**
```bash
docker run -d \
  --name chat-2 \
  --network chatme_chatme-network \
  -e PORT=5001 \
  -e MONGO_URI=mongodb://root:example@mongo:27017/chat?authSource=admin \
  -e REDIS_URL=redis://redis:6379 \
  -e JWT_SECRET=supersecretkey-change-in-production \
  -e CORS_ORIGIN=http://localhost:3000 \
  -e INSTANCE_ID=chat-instance-2 \
  -p 5002:5001 \
  chatme-chat:latest
```

**Note:** You'll need to build the chat image first:
```bash
docker build -t chatme-chat:latest ./backend/chat
```

#### Step 3: Update Frontend to Support Multiple Instances

Create a simple test script or use a load balancer. For testing, you can:

**Option A: Use Nginx as Load Balancer**

Create `nginx-loadbalancer.conf`:
```nginx
upstream chat_backend {
    server localhost:5001;
    server localhost:5002;
}

server {
    listen 5003;
    
    location / {
        proxy_pass http://chat_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

#### Step 4: Test Message Broadcasting

1. **Connect User 1** to instance 1 (port 5001)
2. **Connect User 2** to instance 2 (port 5002)
3. **Both join the same room** (e.g., "test")
4. **User 1 sends a message**
5. **Verify:** User 2 receives the message even though they're on different instances

#### Step 5: Verify No Duplicate Messages

1. Check logs of both instances:
```bash
docker logs chat-1
docker logs chat-2
```

2. Verify that:
   - Messages are published to Redis
   - Each instance only processes messages from other instances
   - No duplicate messages appear

#### Step 6: Test Instance Failure

1. Stop one instance:
```bash
docker stop chat-1
```

2. Verify:
   - Remaining instance continues working
   - Messages still flow correctly
   - No data loss

#### Expected Results
- ✅ Messages broadcast across all instances
- ✅ No duplicate messages
- ✅ Instance failures don't affect other instances
- ✅ All messages saved to MongoDB

---

## 2. Kubernetes Deployment Testing

### Objective
Deploy and test the application on Kubernetes.

### Prerequisites
- Kubernetes cluster (local: minikube, kind, or cloud: GKE, EKS, AKS)
- kubectl configured
- Docker images pushed to DockerHub (or local registry)

### Steps

#### Step 1: Update Kubernetes Manifests

Update `k8s/*.yaml` files with your DockerHub username:
```bash
# Replace YOUR_DOCKERHUB_USERNAME in all k8s yaml files (if needed)
# sed -i 's/YOUR_DOCKERHUB_USERNAME/suyashag/g' k8s/*.yaml
# Note: Already configured with suyashag
```

#### Step 2: Apply MongoDB and Redis First
```bash
kubectl apply -f k8s/mongo-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml

# Wait for them to be ready
kubectl wait --for=condition=available --timeout=300s deployment/mongo
kubectl wait --for=condition=available --timeout=300s deployment/redis
```

#### Step 3: Apply Backend Services
```bash
kubectl apply -f k8s/auth-deployment.yaml
kubectl apply -f k8s/chat-deployment.yaml

# Wait for deployments
kubectl wait --for=condition=available --timeout=300s deployment/auth
kubectl wait --for=condition=available --timeout=300s deployment/chat
```

#### Step 4: Apply Frontend
```bash
kubectl apply -f k8s/frontend-deployment.yaml
kubectl wait --for=condition=available --timeout=300s deployment/frontend
```

#### Step 5: Apply Ingress
```bash
kubectl apply -f k8s/ingress.yaml
```

#### Step 6: Verify Deployment

**Check Pods:**
```bash
kubectl get pods
# Should show all pods in Running state
```

**Check Services:**
```bash
kubectl get services
# Should show all services
```

**Check Ingress:**
```bash
kubectl get ingress
```

#### Step 7: Test Horizontal Pod Autoscaling

**Check HPA:**
```bash
kubectl get hpa
```

**Generate Load (in another terminal):**
```bash
# Install hey or use ab (Apache Bench)
hey -n 1000 -c 10 http://<ingress-ip>/health
```

**Watch HPA:**
```bash
watch kubectl get hpa
# Should see replicas scaling up
```

**Check Pods Scaling:**
```bash
kubectl get pods -w
# Should see new pods being created
```

#### Step 8: Test Service Discovery

1. **Port forward to test services:**
```bash
kubectl port-forward service/auth 5000:5000
kubectl port-forward service/chat 5001:5001
```

2. **Test endpoints:**
```bash
curl http://localhost:5000/health
curl http://localhost:5001/health
```

#### Step 9: Test Pod Restarts

**Delete a pod:**
```bash
kubectl delete pod <pod-name>
```

**Verify:**
- New pod is created automatically
- Service continues working
- No data loss

#### Step 10: Test Rolling Updates

**Update image:**
```bash
kubectl set image deployment/auth auth=suyashag/chatme-auth:new-tag
```

**Watch rollout:**
```bash
kubectl rollout status deployment/auth
```

**Verify:**
- Zero-downtime deployment
- Old pods terminate gracefully
- New pods start successfully

#### Expected Results
- ✅ All services deployed successfully
- ✅ HPA scales based on load
- ✅ Services discover each other
- ✅ Rolling updates work without downtime
- ✅ Pod restarts don't affect service

---

## 3. CI/CD Pipeline Testing

### Objective
Test the GitHub Actions CI/CD pipeline.

### Prerequisites
- GitHub repository
- DockerHub account
- Kubernetes cluster access
- GitHub Secrets configured

### Steps

#### Step 1: Configure GitHub Secrets

Go to: `Settings > Secrets and variables > Actions`

Add these secrets:
- `DOCKERHUB_USERNAME`: Your DockerHub username
- `DOCKERHUB_TOKEN`: Your DockerHub access token
- `KUBECONFIG`: Your Kubernetes config file content

**Get DockerHub Token:**
1. Go to DockerHub > Account Settings > Security
2. Create new access token

**Get KUBECONFIG:**
```bash
cat ~/.kube/config | base64 -w 0  # Linux/Mac
cat ~/.kube/config | base64        # Windows (PowerShell)
```

#### Step 2: Test Build Job

**Create a test branch:**
```bash
git checkout -b test-ci-cd
git push origin test-ci-cd
```

**Or push to develop branch:**
```bash
git checkout develop
# Make a small change
git commit -am "Test CI/CD"
git push origin develop
```

#### Step 3: Monitor GitHub Actions

1. Go to your GitHub repository
2. Click "Actions" tab
3. Watch the workflow run

#### Step 4: Verify Build Steps

Check that:
- ✅ Code is checked out
- ✅ Docker images are built
- ✅ Images are pushed to DockerHub
- ✅ Images have correct tags (latest and commit SHA)

**Verify on DockerHub:**
- Go to your DockerHub repository
- Check for new images with tags

#### Step 5: Test Deployment (Main/Master Branch Only)

**Merge to main:**
```bash
git checkout main
git merge develop
git push origin main
```

**Monitor deployment:**
- Watch GitHub Actions for deploy job
- Check Kubernetes cluster

**Verify deployment:**
```bash
kubectl get pods
kubectl get services
kubectl get ingress
```

#### Step 6: Test Rollback

**If deployment fails:**
1. Check GitHub Actions logs
2. Fix the issue
3. Push again
4. Verify rollback works

#### Expected Results
- ✅ Images built and pushed on every push
- ✅ Deployment happens on main/master branch
- ✅ Kubernetes deployment succeeds
- ✅ Services are healthy after deployment

---

## 4. Load Testing with Multiple Users

### Objective
Test the application under load with multiple concurrent users.

### Prerequisites
- Application running
- Load testing tool (k6, Apache Bench, Artillery, or custom script)

### Method 1: Using k6 (Recommended)

#### Step 1: Install k6
```bash
# Windows (Chocolatey)
choco install k6

# Mac
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Step 2: Create Load Test Script

Create `load-test.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },     // Stay at 10 users
    { duration: '30s', target: 50 },    // Ramp up to 50 users
    { duration: '1m', target: 50 },     // Stay at 50 users
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests < 500ms
    errors: ['rate<0.1'],               // Error rate < 10%
  },
};

const BASE_URL = 'http://localhost:5000';
const CHAT_URL = 'http://localhost:5001';

export default function () {
  // Register a new user
  const username = `user_${__VU}_${__ITER}`;
  const password = 'testpass123';
  
  const registerRes = http.post(`${BASE_URL}/auth/register`, 
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const registerSuccess = check(registerRes, {
    'register status 201': (r) => r.status === 201,
  });
  errorRate.add(!registerSuccess);
  
  if (!registerSuccess) {
    sleep(1);
    return;
  }
  
  // Login
  const loginRes = http.post(`${BASE_URL}/auth/login`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const loginSuccess = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).token !== undefined,
  });
  errorRate.add(!loginSuccess);
  
  if (!loginSuccess) {
    sleep(1);
    return;
  }
  
  const token = JSON.parse(loginRes.body).token;
  
  // Get profile
  const profileRes = http.get(`${BASE_URL}/auth/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  check(profileRes, {
    'profile status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

#### Step 3: Run Load Test
```bash
k6 run load-test.js
```

#### Step 4: Analyze Results

Look for:
- Request rate (RPS)
- Response times (p50, p95, p99)
- Error rate
- Throughput

### Method 2: Using Apache Bench (Simple)

#### Step 1: Test Auth Endpoint
```bash
# Test registration
ab -n 1000 -c 10 -p register.json -T application/json \
  http://localhost:5000/auth/register

# Test login
ab -n 1000 -c 10 -p login.json -T application/json \
  http://localhost:5000/auth/login
```

Create `register.json`:
```json
{"username":"testuser","password":"test123"}
```

### Method 3: Manual Multi-User Test

#### Step 1: Open Multiple Browser Windows
- Open 10-20 browser windows/tabs
- Use incognito/private mode for each

#### Step 2: Register Multiple Users
- Register different users in each window
- Note the time taken

#### Step 3: Test Concurrent Chat
- All users join the same room
- All send messages simultaneously
- Monitor for:
  - Message delivery
  - Response times
  - Any errors

#### Step 4: Monitor Resources
```bash
# CPU and Memory usage
docker stats

# Service logs
docker-compose logs -f --tail=100
```

### Expected Results
- ✅ System handles 50+ concurrent users
- ✅ Response times < 500ms (p95)
- ✅ Error rate < 1%
- ✅ No message loss
- ✅ Services remain stable

---

## 5. Error Scenarios Testing

### Objective
Test application resilience under failure conditions.

### Scenario 1: Network Failures

#### Test: MongoDB Connection Loss

**Steps:**
1. Stop MongoDB:
```bash
docker stop mongo
```

2. Try to register a user
3. **Expected:** Error message, graceful failure

4. Restart MongoDB:
```bash
docker start mongo
```

5. **Expected:** Service reconnects automatically

#### Test: Redis Connection Loss

**Steps:**
1. Stop Redis:
```bash
docker stop redis
```

2. Try to send a message
3. **Expected:** Error or degraded functionality

4. Restart Redis:
```bash
docker start redis
```

5. **Expected:** Service reconnects, messages resume

### Scenario 2: Service Restarts

#### Test: Auth Service Restart

**Steps:**
1. Restart auth service:
```bash
docker restart auth
```

2. **Expected:**
   - Frontend shows error temporarily
   - Service recovers automatically
   - Users can retry operations

#### Test: Chat Service Restart

**Steps:**
1. Restart chat service:
```bash
docker restart chat
```

2. **Expected:**
   - WebSocket disconnects
   - Frontend shows disconnected status
   - Auto-reconnect when service is back
   - No message loss (messages saved to DB)

### Scenario 3: High Error Rates

#### Test: Invalid Requests

**Steps:**
1. Send invalid registration:
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'
```

2. **Expected:** Proper error response (400)

3. Send invalid login:
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nonexistent","password":"wrong"}'
```

4. **Expected:** Proper error response (400)

### Scenario 4: Resource Exhaustion

#### Test: Memory Pressure

**Steps:**
1. Monitor memory:
```bash
docker stats
```

2. Send many large messages
3. **Expected:** Service handles gracefully or shows error

#### Test: Database Full

**Steps:**
1. Fill MongoDB with test data
2. Try to save new messages
3. **Expected:** Proper error handling

### Scenario 5: Concurrent Operations

#### Test: Race Conditions

**Steps:**
1. Register same username from multiple clients simultaneously
2. **Expected:** Only one succeeds, others get "User already exists"

#### Test: Message Ordering

**Steps:**
1. Send 100 messages rapidly from multiple users
2. **Expected:** Messages appear in correct order

### Scenario 6: Authentication Failures

#### Test: Invalid Token

**Steps:**
1. Use invalid JWT token:
```bash
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:5000/auth/profile
```

2. **Expected:** 401 Unauthorized

#### Test: Expired Token

**Steps:**
1. Wait for token to expire (or modify JWT_SECRET)
2. Try to access protected endpoint
3. **Expected:** 401 Unauthorized, redirect to login

### Monitoring During Error Tests

**Watch Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth
docker-compose logs -f chat
```

**Watch Metrics:**
```bash
# Container stats
docker stats

# Service health
curl http://localhost:5000/health
curl http://localhost:5001/health
```

### Expected Results
- ✅ Services handle errors gracefully
- ✅ No crashes or data corruption
- ✅ Proper error messages to users
- ✅ Automatic recovery when possible
- ✅ Logs capture errors for debugging

---

## Quick Test Checklist

### Horizontal Scaling
- [ ] Multiple instances run simultaneously
- [ ] Messages broadcast across instances
- [ ] No duplicate messages
- [ ] Instance failure doesn't affect others

### Kubernetes
- [ ] All pods deploy successfully
- [ ] HPA scales based on load
- [ ] Services discover each other
- [ ] Rolling updates work

### CI/CD
- [ ] Images build on push
- [ ] Images pushed to DockerHub
- [ ] Deployment triggers on main branch
- [ ] Kubernetes deployment succeeds

### Load Testing
- [ ] Handles 50+ concurrent users
- [ ] Response times acceptable
- [ ] Low error rate
- [ ] No data loss

### Error Scenarios
- [ ] Network failures handled
- [ ] Service restarts recover
- [ ] Invalid requests rejected properly
- [ ] Authentication failures handled

---

## Tools Reference

- **k6**: https://k6.io/docs/
- **Apache Bench**: Built-in on most systems
- **Artillery**: https://www.artillery.io/
- **Docker Compose**: https://docs.docker.com/compose/
- **kubectl**: https://kubernetes.io/docs/reference/kubectl/
- **GitHub Actions**: https://docs.github.com/en/actions

---

## Troubleshooting

### Issues with Horizontal Scaling
- Check Redis connection
- Verify INSTANCE_ID is unique
- Check network connectivity

### Issues with Kubernetes
- Check pod logs: `kubectl logs <pod-name>`
- Check service endpoints: `kubectl get endpoints`
- Verify image pull: `kubectl describe pod <pod-name>`

### Issues with CI/CD
- Check GitHub Secrets are set
- Verify DockerHub credentials
- Check Kubernetes config format

### Issues with Load Testing
- Start with low load and increase gradually
- Monitor resource usage
- Check service limits

---

**Happy Testing! 🚀**

