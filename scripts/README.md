# Testing Scripts

Quick scripts to help with advanced testing scenarios.

## Scripts

### 1. `test-horizontal-scaling.sh`
Tests horizontal scaling by running multiple chat service instances.

**Usage:**
```bash
chmod +x scripts/test-horizontal-scaling.sh
./scripts/test-horizontal-scaling.sh
```

**What it does:**
- Builds chat service image
- Starts 2 chat service instances on different ports
- Verifies both are running
- Provides instructions for testing

### 2. `load-test.js`
Load testing script using k6.

**Prerequisites:**
- Install k6: https://k6.io/docs/getting-started/installation/

**Usage:**
```bash
# Basic test
k6 run scripts/load-test.js

# With custom URLs
k6 run -e AUTH_URL=http://localhost:5000 -e CHAT_URL=http://localhost:5001 scripts/load-test.js

# With more virtual users
k6 run --vus 100 --duration 5m scripts/load-test.js
```

**What it tests:**
- Registration endpoint
- Login endpoint
- Profile endpoint (with authentication)
- Health endpoint
- Response times and error rates

### 3. `test-error-scenarios.sh`
Tests various error conditions and edge cases.

**Usage:**
```bash
chmod +x scripts/test-error-scenarios.sh
./scripts/test-error-scenarios.sh
```

**What it tests:**
- Invalid registration requests
- Duplicate user registration
- Invalid login credentials
- Missing authentication token
- Invalid authentication token
- Health check endpoint
- Service restart recovery

## Notes

- Make sure services are running before executing scripts
- Some scripts require Docker to be running
- Load tests may take several minutes to complete
- Adjust load test parameters based on your system capacity

