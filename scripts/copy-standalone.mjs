import { copyFileSync, mkdirSync, readdirSync, existsSync, statSync } from "fs";
import { join, relative, dirname } from "path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");
const publicDir = join(root, "public");
const staticDir = join(root, ".next", "static");

console.log("Preparing standalone build...");

// Ensure .next/standalone exists
mkdirSync(standaloneDir, { recursive: true });

// Copy .next/static into standalone/.next/static
const targetStatic = join(standaloneDir, ".next", "static");
mkdirSync(targetStatic, { recursive: true });

function copyRecursive(src, dest) {
  if (!existsSync(src)) return;
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(staticDir, targetStatic);

// Copy public into standalone/public
if (existsSync(publicDir)) {
  copyRecursive(publicDir, join(standaloneDir, "public"));
}

console.log("Standalone build prepared successfully");
