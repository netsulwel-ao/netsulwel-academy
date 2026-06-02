/** @type {import('@lhci/cli').LhciConfig} */
module.exports = {
  ci: {
    collect: {
      // URL base — muda para o URL de produção ou staging
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/login",
        "http://localhost:3000/dashboard",
        "http://localhost:3000/dashboard/courses",
      ],
      startServerCommand: "npm start",
      startServerReadyPattern: "ready on",
      startServerReadyTimeout: 30000,
      numberOfRuns: 3, // média de 3 runs para resultados estáveis
    },
    assert: {
      // Thresholds mínimos — falha o CI se não atingir
      assertions: {
        // Performance
        "categories:performance": ["warn", { minScore: 0.75 }],       // aviso abaixo de 75
        "categories:accessibility": ["error", { minScore: 0.90 }],    // erro abaixo de 90
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        "categories:seo": ["warn", { minScore: 0.80 }],

        // Core Web Vitals
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],  // < 2s
        "largest-contentful-paint": ["warn", { maxNumericValue: 3000 }], // < 3s
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],  // < 0.1
        "total-blocking-time": ["warn", { maxNumericValue: 500 }],       // < 500ms
        "speed-index": ["warn", { maxNumericValue: 3500 }],

        // Boas práticas
        "uses-https": "off",           // desligado em localhost
        "is-on-https": "off",
        "redirects-http": "off",
      },
    },
    upload: {
      // Guardar relatórios localmente (sem servidor LHCI externo)
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
