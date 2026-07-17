import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8888/api';
const TARGET_VUS = Number(__ENV.VUS || 20);
export const options = {
  scenarios: { learner_load: { executor: 'ramping-vus', startVUs: 0, stages: [
    { duration: '15s', target: Math.max(2, Math.floor(TARGET_VUS / 4)) },
    { duration: '30s', target: TARGET_VUS }, { duration: '30s', target: TARGET_VUS }, { duration: '15s', target: 0 },
  ], gracefulRampDown: '5s' } },
  thresholds: {
    http_req_failed: ['rate<0.01'], checks: ['rate>0.99'],
    'http_req_duration{endpoint:dashboard}': ['p(95)<600'],
    'http_req_duration{endpoint:growth}': ['p(95)<800'],
    'http_req_duration{endpoint:catalog}': ['p(95)<400'],
  },
};

export function setup() {
  const response = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ username: __ENV.K6_USERNAME || 'student', password: __ENV.K6_PASSWORD || 'student123' }), { headers: { 'Content-Type': 'application/json' } });
  if (response.status !== 200) throw new Error(`Login failed: ${response.status} ${response.body}`);
  return { token: response.json('data.token') };
}

export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}` };
  const responses = http.batch([
    ['GET', `${BASE_URL}/learning-paths`, null, { tags: { endpoint: 'catalog' } }],
    ['GET', `${BASE_URL}/labs`, null, { tags: { endpoint: 'catalog' } }],
    ['GET', `${BASE_URL}/users/me/dashboard`, null, { headers, tags: { endpoint: 'dashboard' } }],
    ['GET', `${BASE_URL}/users/me/resume`, null, { headers, tags: { endpoint: 'resume' } }],
    ['GET', `${BASE_URL}/growth`, null, { headers, tags: { endpoint: 'growth' } }],
  ]);
  responses.forEach(response => check(response, { 'status 200': r => r.status === 200 }));
  sleep(Math.random() * 1.5 + 0.5);
}
