import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function getServiceAccount(): admin.ServiceAccount | null {
  // 1. Env vars individuais (recomendado para Hostinger)
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    let pk = process.env.FIREBASE_PRIVATE_KEY;
    // Remove aspas duplas no início/fim se houver
    pk = pk.replace(/^"|"$/g, "");
    // Converte \n literais em quebras de linha reais
    pk = pk.replace(/\\n/g, "\n");
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: pk,
    };
  }

  // 2. Env var com JSON em base64
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf-8");
      return JSON.parse(decoded);
    } catch {
      // ignore
    }
  }

  // 2. Env var com JSON inline
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    try {
      return JSON.parse(key);
    } catch {
      // ignore
    }
  }

  // 3. Env var com caminho do ficheiro
  const pathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (pathFromEnv && existsSync(pathFromEnv)) {
    try {
      return JSON.parse(readFileSync(pathFromEnv, "utf-8"));
    } catch {
      // ignore
    }
  }

  // 3. Ficheiro na raiz do projeto (não versionado)
  const files = [
    "netsulwel-academy-firebase-adminsdk-fbsvc-aad186c64e.json",
    "service-account.json",
    "serviceAccountKey.json",
  ];
  for (const file of files) {
    const fullPath = join(process.cwd(), file);
    if (existsSync(fullPath)) {
      try {
        return JSON.parse(readFileSync(fullPath, "utf-8"));
      } catch {
        // ignore
      }
    }
  }

  return null;
}

let initialized = false;

export function getFirebaseAdmin() {
  if (initialized && admin.apps.length) return admin;

  const serviceAccount = getServiceAccount();

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  initialized = true;
  return admin;
}
