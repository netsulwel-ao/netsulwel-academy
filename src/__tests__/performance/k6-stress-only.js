import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter } from "k6/metrics";

const apiDuration = new Trend("api_duration", true);
const requestCount = new Counter("requests_total");
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  scenarios: {
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 20 },
        { duration: "15s", target: 50 },
        { duration: "20s", target: 100 },
        { duration: "30s", target: 100 },
        { duration: "15s", target: 0 },
      ],
      gracefulStop: "15s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<4000", "p(99)<6000"],
    http_req_failed: ["rate<0.50"],
  },
};

function testLanding() {
  const res = http.get(`${BASE_URL}/`);
  check(res, { "landing: 200": (r) => r.status === 200 });
  apiDuration.add(res.timings.duration, { endpoint: "landing" });
  requestCount.add(1);
}

function testStatic(page) {
  const res = http.get(`${BASE_URL}${page}`);
  check(res, { [`${page}: 200`]: (r) => r.status === 200 });
  apiDuration.add(res.timings.duration, { endpoint: page });
  requestCount.add(1);
}

export default function () {
  const rand = Math.random();
  if (rand < 0.5) testLanding();
  else if (rand < 0.75) testStatic("/login");
  else testStatic("/professores");
  sleep(Math.random() * 1 + 0.3);
}
