import { GoogleAuth } from "google-auth-library";

const email = process.argv[2];
if (!email) {
  console.error("Uso: node --env-file=.env.local scripts/make-admin.mjs <email>");
  process.exit(1);
}

let pk = process.env.FIREBASE_PRIVATE_KEY;
if (pk.startsWith('"') && pk.endsWith('"')) pk = pk.slice(1, -1);
pk = pk.replace(/\\n/g, "\n");

const sa = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: pk,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
};

const auth = new GoogleAuth({ credentials: sa, scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
const client = await auth.getClient();
const token = await client.getAccessToken();

// 1. Buscar UID pelo email via Firebase Auth REST API
const uri = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
const lookup = await fetch(uri, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});
const lookupData = await lookup.json();
if (!lookupData.users?.length) {
  console.error(`Email ${email} não encontrado no Firebase Auth.`);
  process.exit(1);
}
const uid = lookupData.users[0].localId;
console.log("UID:", uid);

// 2. Atualizar role no Firestore via REST API
const projectId = process.env.FIREBASE_PROJECT_ID;
const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=role&currentDocument.exists=true`;
const update = await fetch(firestoreUrl, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token.token}`,
  },
  body: JSON.stringify({
    fields: {
      role: { stringValue: "admin" },
    },
  }),
});
if (!update.ok) {
  const text = await update.text();
  console.error("Erro Firestore:", update.status, text);
  process.exit(1);
}
console.log(`✓ ${email} (${uid}) → admin`);
