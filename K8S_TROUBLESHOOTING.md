# Kubernetes Troubleshooting Guide

## Issue: Only MongoDB and Redis pods are running

### Common Causes

1. **Docker images don't exist on DockerHub**
2. **Image pull errors**
3. **Resource constraints**
4. **Missing dependencies**

## Quick Diagnosis

### Step 1: Check Pod Status
```bash
kubectl get pods
```

### Step 2: Check Pod Details
```bash
# Check auth pods
kubectl describe pod -l app=auth

# Check chat pods
kubectl describe pod -l app=chat

# Check frontend pods
kubectl describe pod -l app=frontend
```

### Step 3: Check Pod Logs
```bash
# Get pod names first
kubectl get pods

# Then check logs
kubectl logs <pod-name>
```

## Common Issues and Solutions

### Issue 1: ImagePullBackOff or ErrImagePull

**Symptoms:**
- Pod status shows `ImagePullBackOff` or `ErrImagePull`
- Error: "pull access denied" or "repository does not exist"

**Solution:**
The Docker images don't exist on DockerHub yet. You need to build and push them:

```bash
# Build images
docker build -t suyashag/chatme-auth:latest ./backend/auth
docker build -t suyashag/chatme-chat:latest ./backend/chat
docker build -t suyashag/chatme-frontend:latest ./frontend

# Login to DockerHub
docker login

# Push images
docker push suyashag/chatme-auth:latest
docker push suyashag/chatme-chat:latest
docker push suyashag/chatme-frontend:latest
```

### Issue 2: CrashLoopBackOff

**Symptoms:**
- Pod status shows `CrashLoopBackOff`
- Pod keeps restarting

**Solution:**
Check logs to see why the container is crashing:
```bash
kubectl logs <pod-name> --previous
```

Common causes:
- MongoDB connection issues
- Redis connection issues
- Missing environment variables
- Application errors

### Issue 3: Pending Status

**Symptoms:**
- Pod status shows `Pending`
- No events or errors

**Solution:**
Check if resources are available:
```bash
kubectl describe pod <pod-name>
```

Look for:
- Insufficient CPU/Memory
- Node selector issues
- PVC binding issues

### Issue 4: HPA Issues

**Symptoms:**
- HPA shows "unknown" metrics
- Pods not scaling

**Solution:**
Check if metrics-server is installed:
```bash
kubectl get deployment metrics-server -n kube-system
```

If not installed, install it or remove HPA temporarily.

## Quick Fix: Use Local Images (For Testing)

If you're testing locally (minikube/kind), you can load images directly:

### For Minikube:
```bash
# Build images
docker build -t suyashag/chatme-auth:latest ./backend/auth
docker build -t suyashag/chatme-chat:latest ./backend/chat
docker build -t suyashag/chatme-frontend:latest ./frontend

# Load into minikube
minikube image load suyashag/chatme-auth:latest
minikube image load suyashag/chatme-chat:latest
minikube image load suyashag/chatme-frontend:latest
```

### For Kind:
```bash
# Build images
docker build -t suyashag/chatme-auth:latest ./backend/auth
docker build -t suyashag/chatme-chat:latest ./backend/chat
docker build -t suyashag/chatme-frontend:latest ./frontend

# Load into kind
kind load docker-image suyashag/chatme-auth:latest
kind load docker-image suyashag/chatme-chat:latest
kind load docker-image suyashag/chatme-frontend:latest
```

## Step-by-Step Recovery

### 1. Check Current Status
```bash
kubectl get pods -o wide
kubectl get events --sort-by='.lastTimestamp'
```

### 2. Delete Failed Deployments
```bash
kubectl delete deployment auth chat frontend
```

### 3. Build and Push Images (or load locally)
```bash
# See Issue 1 or Quick Fix above
```

### 4. Reapply Deployments
```bash
kubectl apply -f k8s/auth-deployment.yaml
kubectl apply -f k8s/chat-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

### 5. Watch Pods Start
```bash
kubectl get pods -w
```

### 6. Check Logs
```bash
kubectl logs -f deployment/auth
kubectl logs -f deployment/chat
kubectl logs -f deployment/frontend
```

## Verification Commands

```bash
# Check all resources
kubectl get all

# Check services
kubectl get svc

# Check configmaps and secrets
kubectl get configmap
kubectl get secret

# Check HPA
kubectl get hpa

# Check pod events
kubectl get events --field-selector involvedObject.kind=Pod
```

## Expected Output

After successful deployment:
```
NAME                          READY   STATUS    RESTARTS   AGE
auth-xxxxxxxxxx-xxxxx          1/1     Running   0          2m
auth-xxxxxxxxxx-xxxxx          1/1     Running   0          2m
chat-xxxxxxxxxx-xxxxx          1/1     Running   0          2m
chat-xxxxxxxxxx-xxxxx          1/1     Running   0          2m
frontend-xxxxxxxxxx-xxxxx      1/1     Running   0          2m
frontend-xxxxxxxxxx-xxxxx      1/1     Running   0          2m
mongo-xxxxxxxxxx-xxxxx         1/1     Running   0          10m
redis-xxxxxxxxxx-xxxxx         1/1     Running   0          10m
```

