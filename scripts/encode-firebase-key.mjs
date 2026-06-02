/**
 * Converte o ficheiro service account JSON para Base64.
 * Uso: node scripts/encode-firebase-key.mjs
 *
 * Copia o output e adiciona como variável de ambiente na Hostinger:
 * FIREBASE_SERVICE_ACCOUNT_BASE64=<valor copiado>
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const candidates = [
  "netsulwel-academy-firebase-adminsdk-fbsvc-aad186c64e.json",
  "service-account.json",
  "serviceAccountKey.json",
];

let filePath = null;
for (const f of candidates) {
  const p = join(process.cwd(), f);
  if (existsSync(p)) { filePath = p; break; }
}

if (!filePath) {
  console.error("❌ Ficheiro service account não encontrado.");
  console.error("   Coloca o ficheiro na raiz do projeto e tenta novamente.");
  process.exit(1);
}

const content = readFileSync(filePath, "utf-8");
// Validar que é JSON válido
try { JSON.parse(content); } catch {
  console.error("❌ O ficheiro não é JSON válido."); process.exit(1);
}

const base64 = Buffer.from(content).toString("base64");

console.log("\n✅ Copia esta variável de ambiente para o hPanel da Hostinger:\n");
console.log("Nome da variável:");
console.log("  FIREBASE_SERVICE_ACCOUNT_BASE64");
console.log("\nValor:");
console.log(base64);
console.log("\n");
