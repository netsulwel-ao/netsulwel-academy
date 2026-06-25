/**
 * k6 Load Tests — APIs críticas
 *
 * Instalar k6: https://k6.io/docs/getting-started/installation/
 * Windows: winget install k6 --source winget
 *
 * Executar:
 *   k6 run src/__tests__/performance/api-load.js
 *   k6 run --vus 50 --duration 30s src/__tests__/performance/api-load.js
 *
 * Variáveis de ambiente:
 *   k6 run -e BASE_URL=https://academia.netsulwel.tech src/__tests__/performance/api-load.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ── Custom metrics ─────────────────────────────────────────
const errorRate = new Rate("errors");
const apiDuration = new Trend("api_duration", true);
const requestCount = new Counter("requests_total");

// ── Configuração ────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Cenários de carga
export const options = {
  scenarios: {
    // 1. Smoke test — verificar que tudo funciona (1 utilizador)
    smoke: {
      executor: "constant-vus",
      vus: 1,
      duration: "10s",
      tags: { scenario: "smoke" },
    },

    // 2. Load test normal — carga esperada em produção
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 },  // subir para 20 users
        { duration: "1m",  target: 20 },  // manter 1 minuto
        { duration: "20s", target: 0 },   // descer
      ],
      tags: { scenario: "load" },
      startTime: "15s", // começa após smoke
    },

    // 3. Stress test — encontrar o limite
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 50 },
        { duration: "30s", target: 50 },
        { duration: "20s", target: 100 },
        { duration: "30s", target: 100 },
        { duration: "20s", target: 0 },
      ],
      tags: { scenario: "stress" },
      startTime: "2m30s",
    },
  },

  // Thresholds — falha se não atingir
  thresholds: {
    // 95% dos requests < 2s (produção tem Firebase Auth + rede)
    http_req_duration: ["p(95)<2000", "p(99)<3000"],
    // 35% dos requests são 401 esperados (testes sem auth)
    http_req_failed: ["rate<0.40"],
  },
};

// ── Helpers ─────────────────────────────────────────────────
function makeHeaders(token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ── Test: Página principal (landing) ────────────────────────
export function testLanding() {
  const res = http.get(`${BASE_URL}/`);
  const ok = check(res, {
    "landing: status 200": (r) => r.status === 200,
    "landing: < 2s": (r) => r.timings.duration < 2000,
    "landing: tem html": (r) => r.body && r.body.includes("<html"),
  });
  errorRate.add(!ok);
  apiDuration.add(res.timings.duration, { endpoint: "landing" });
  requestCount.add(1);
  return res;
}

// ── Test: Settings (leitura pública) ────────────────────────
export function testSettings() {
  // Simula o fetch de SEO settings que o layout faz
  const projectId = __ENV.FIREBASE_PROJECT_ID || "netsulwel-academy";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/platform`;
  const res = http.get(url);
  const ok = check(res, {
    "settings: status 200 ou 404": (r) => r.status === 200 || r.status === 404,
    "settings: < 1s": (r) => r.timings.duration < 1000,
  });
  errorRate.add(!ok);
  apiDuration.add(res.timings.duration, { endpoint: "settings" });
  requestCount.add(1);
}

// ── Test: API presign (com auth inválido → deve retornar 401) ─
export function testPresignUnauth() {
  const res = http.post(
    `${BASE_URL}/api/upload/presign`,
    JSON.stringify({ filename: "test.jpg", contentType: "image/jpeg", folder: "thumbnails" }),
    { headers: { "Content-Type": "application/json" } } // 401 esperado
  );
  const ok = check(res, {
    "presign unauth: status 401": (r) => r.status === 401,
    "presign unauth: < 1s": (r) => r.timings.duration < 1000,
  });
  errorRate.add(!ok);
  apiDuration.add(res.timings.duration, { endpoint: "presign_unauth" });
  requestCount.add(1);
}

// ── Test: API livekit token (sem auth → 401) ──────────────────
export function testLivekitUnauth() {
  const res = http.post(
    `${BASE_URL}/api/livekit/token`,
    JSON.stringify({ roomName: "test-room", name: "Test User" }),
    { headers: { "Content-Type": "application/json" } } // 401 esperado
  );
  const ok = check(res, {
    "livekit unauth: status 401": (r) => r.status === 401,
    "livekit unauth: < 1s": (r) => r.timings.duration < 1000,
  });
  errorRate.add(!ok);
  apiDuration.add(res.timings.duration, { endpoint: "livekit_unauth" });
  requestCount.add(1);
}

// ── Test: Páginas estáticas ───────────────────────────────────
export function testStaticPages() {
  const pages = ["/login", "/"];
  for (const page of pages) {
    const res = http.get(`${BASE_URL}${page}`);
    const ok = check(res, {
      [`${page}: status 200`]: (r) => r.status === 200,
      [`${page}: < 1.5s`]: (r) => r.timings.duration < 1500,
    });
    errorRate.add(!ok);
    apiDuration.add(res.timings.duration, { endpoint: page });
    requestCount.add(1);
    sleep(0.1);
  }
}

// ── Main scenario ─────────────────────────────────────────────
export default function () {
  // Mix de requests que simula utilizadores reais
  const rand = Math.random();

  if (rand < 0.4) {
    // 40% visitam a landing
    testLanding();
  } else if (rand < 0.6) {
    // 20% tentam upload sem auth (edge case)
    testPresignUnauth();
  } else if (rand < 0.75) {
    // 15% tentam livekit sem auth
    testLivekitUnauth();
  } else if (rand < 0.9) {
    // 15% visitam páginas estáticas
    testStaticPages();
  } else {
    // 10% verificam settings (cache test)
    testSettings();
  }

  // Pausa entre requests (simula comportamento real)
  sleep(Math.random() * 2 + 0.5); // 0.5 a 2.5 segundos
}
