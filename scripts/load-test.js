// Load Test Script for ChatMe
// Run with: k6 run scripts/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

function safe(value) {
    return (value === undefined || value === null) ? "N/A" : value.toFixed(2);
}


const errorRate = new Rate('errors');
const registrationTime = new Trend('registration_time');
const loginTime = new Trend('login_time');
const profileTime = new Trend('profile_time');

const BASE_URL = __ENV.AUTH_URL || 'http://localhost:5000';
const CHAT_URL = __ENV.CHAT_URL || 'http://localhost:5001';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },     // Stay at 50 users
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.1'],
    registration_time: ['p(95)<500'],
    login_time: ['p(95)<300'],
    profile_time: ['p(95)<200'],
  },
};

export default function () {
  const username = `loadtest_user_${__VU}_${__ITER}_${Date.now()}`;
  const password = 'testpass123';
  
  // Test Registration
  const registerStart = Date.now();
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  registrationTime.add(Date.now() - registerStart);
  
  const registerSuccess = check(registerRes, {
    'register status 201': (r) => r.status === 201,
    'register has message': (r) => JSON.parse(r.body).message !== undefined,
  });
  errorRate.add(!registerSuccess);
  
  if (!registerSuccess) {
    sleep(1);
    return;
  }
  
  sleep(0.5);
  
  // Test Login
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginTime.add(Date.now() - loginStart);
  
  const loginSuccess = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token !== undefined && body.token.length > 0;
      } catch (e) {
        return false;
      }
    },
    'login has username': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.username === username;
      } catch (e) {
        return false;
      }
    },
  });
  errorRate.add(!loginSuccess);
  
  if (!loginSuccess) {
    sleep(1);
    return;
  }
  
  const token = JSON.parse(loginRes.body).token;
  sleep(0.5);
  
  // Test Profile (Protected Endpoint)
  const profileStart = Date.now();
  const profileRes = http.get(`${BASE_URL}/auth/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  profileTime.add(Date.now() - profileStart);
  
  const profileSuccess = check(profileRes, {
    'profile status 200': (r) => r.status === 200,
    'profile has username': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.username === username;
      } catch (e) {
        return false;
      }
    },
  });
  errorRate.add(!profileSuccess);
  
  // Test Health Endpoint
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}Load Test Summary\n`;
  summary += `${indent}==================\n\n`;
  
  // Metrics
  summary += `${indent}Metrics:\n`;
  summary += `${indent}  - Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  - Failed Requests: ${data.metrics.http_req_failed.values.passes}\n`;
  summary += `${indent}  - Error Rate: ${safe(data.metrics.errors.values.rate * 100)}%\n\n`;
  
  // Response Times
  summary += `${indent}Response Times:\n`;
  summary += `${indent}  - Average: ${safe(data.metrics.http_req_duration.values.avg)}ms\n`;
  summary += `${indent}  - P95: ${safe(data.metrics.http_req_duration.values['p(95)'])}ms\n`;
  summary += `${indent}  - P99: ${safe(data.metrics.http_req_duration.values['p(99)'])}ms\n\n`;
  
  // Thresholds
  summary += `${indent}Thresholds:\n`;
  Object.keys(data.metrics).forEach(metric => {
    if (data.metrics[metric].thresholds) {
      Object.keys(data.metrics[metric].thresholds).forEach(threshold => {
        const passed = data.metrics[metric].thresholds[threshold].ok;
        const status = passed ? '✅' : '❌';
        summary += `${indent}  ${status} ${threshold}\n`;
      });
    }
  });
  
  return summary;
}

