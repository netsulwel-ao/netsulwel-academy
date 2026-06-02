/**
 * Copia os ficheiros estáticos para dentro da pasta standalone.
 * Necessário para a Hostinger servir correctamente os assets do Next.js.
 * Corre automaticamente após `next build`.
 */

import { cpSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.log("⚠️  Pasta standalone não encontrada — output:standalone não está activo no next.config.ts");
  process.exit(0);
}

// Copiar .next/static → .next/standalone/.next/static
const staticSrc = join(root, ".next", "static");
const staticDest = join(standaloneDir, ".next", "static");
if (existsSync(staticSrc)) {
  mkdirSync(staticDest, { recursive: true });
  cpSync(staticSrc, staticDest, { recursive: true });
  console.log("✅ .next/static copiado para standalone");
}

// Copiar public/ → .next/standalone/public
const publicSrc = join(root, "public");
const publicDest = join(standaloneDir, "public");
if (existsSync(publicSrc)) {
  mkdirSync(publicDest, { recursive: true });
  cpSync(publicSrc, publicDest, { recursive: true });
  console.log("✅ public/ copiado para standalone");
}

console.log("✅ Build standalone pronto para deploy na Hostinger");
