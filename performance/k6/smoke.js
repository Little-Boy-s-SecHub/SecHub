import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8888/api';
export const options = {
  vus: 1, duration: '15s',
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<500'], checks: ['rate>0.99'] },
};

export function setup() {
  const response = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ username: __ENV.K6_USERNAME || 'student', password: __ENV.K6_PASSWORD || 'student123' }), { headers: { 'Content-Type': 'application/json' } });
  check(response, { 'login 200': r => r.status === 200, 'token returned': r => Boolean(r.json('data.token')) });
  return { token: response.json('data.token') };
}

export default function (data) {
  const auth = { headers: { Authorization: `Bearer ${data.token}` }, tags: { flow: 'learner' } };
  const publicResponses = http.batch([
    ['GET', `${BASE_URL}/vulnerabilities`, null, { tags: { endpoint: 'vulnerabilities' } }],
    ['GET', `${BASE_URL}/learning-paths`, null, { tags: { endpoint: 'learning-paths' } }],
    ['GET', `${BASE_URL}/labs`, null, { tags: { endpoint: 'labs' } }],
  ]);
  publicResponses.forEach(response => check(response, { 'public API 200': r => r.status === 200 }));
  const learnerResponses = http.batch([
    ['GET', `${BASE_URL}/users/me/dashboard`, null, auth],
    ['GET', `${BASE_URL}/users/me/resume`, null, auth],
    ['GET', `${BASE_URL}/growth`, null, auth],
    ['GET', `${BASE_URL}/review`, null, auth],
  ]);
  learnerResponses.forEach(response => check(response, { 'learner API 200': r => r.status === 200 }));
  sleep(1);
}
