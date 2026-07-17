import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8888/api';
export const options = {
  scenarios: { stress: { executor: 'ramping-arrival-rate', startRate: 5, timeUnit: '1s', preAllocatedVUs: 30, maxVUs: 150,
    stages: [{ duration: '30s', target: 20 }, { duration: '30s', target: 50 }, { duration: '30s', target: 100 }, { duration: '20s', target: 0 }] } },
  thresholds: { http_req_failed: ['rate<0.03'], http_req_duration: ['p(95)<1000'], checks: ['rate>0.97'] },
};

export default function () {
  const response = http.get(`${BASE_URL}/learning-paths`, { tags: { endpoint: 'public-catalog' } });
  check(response, { 'catalog available': r => r.status === 200 }); sleep(0.2);
}
