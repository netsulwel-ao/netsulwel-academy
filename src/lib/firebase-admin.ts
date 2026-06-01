import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function getServiceAccount(): admin.ServiceAccount | null {
  // 1. Env var com JSON inline
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    try {
      return JSON.parse(key);
    } catch {
      // ignore
    }
  }

  // 2. Env var com caminho do ficheiro
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
