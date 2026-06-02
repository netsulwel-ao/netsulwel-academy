import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const envPath = join(root, ".env.local");
  const raw = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  return env;
}

const env = loadEnv();
const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = env.FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
let pk = env.FIREBASE_PRIVATE_KEY || "";
pk = pk.replace(/^"|"$/g, "").replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");

const emailToPromote = process.argv[2];
const password = process.argv[3] || "Admin123!";
if (!emailToPromote) {
  console.error("Usage: node scripts/make-admin-v2.mjs <email> [password]");
  process.exit(1);
}

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken");

// Get real time from web for JWT assertion
const timeResp = await fetch("https://timeapi.io/api/Time/current/zone?timeZone=UTC");
const timeData = await timeResp.json();
const now = Math.floor(new Date(timeData.dateTime).getTime() / 1000);
const isoNow = new Date(timeData.dateTime).toISOString();

// Get service account access token
const assertion = jwt.sign(
  {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  },
  pk,
  { algorithm: "RS256" }
);

const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  }),
});
const tokenData = await tokenResp.json();
if (!tokenData.access_token) {
  console.error("Failed to get access token:", JSON.stringify(tokenData, null, 2));
  process.exit(1);
}
const accessToken = tokenData.access_token;

// Step 1: Try to create the user using accounts:signUp with Web API key
// (this is the standard Firebase Auth REST API)
console.log(`Creating user ${emailToPromote}...`);
const signUpResp = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailToPromote,
      password: password,
      returnSecureToken: true,
    }),
  }
);
const signUpData = await signUpResp.json();
if (!signUpResp.ok) {
  console.error("Failed to create user:", JSON.stringify(signUpData, null, 2));
  process.exit(1);
}

const uid = signUpData.localId;
const idToken = signUpData.idToken;
console.log(`User created: ${uid}`);

// Step 2: Use the service account to set custom claims (admin role) and Firestore doc
// First, set custom claims
console.log("Setting custom claims (role=admin)...");
const claimsResp = await fetch(
  `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      localId: uid,
      customAttributes: JSON.stringify({ role: "admin" }),
    }),
  }
);
const claimsData = await claimsResp.json();
if (!claimsResp.ok) {
  console.error("Failed to set claims:", JSON.stringify(claimsData, null, 2));
  process.exit(1);
}
console.log("Custom claims set!");

// Step 3: Create Firestore user document
console.log("Creating Firestore document...");
const firestoreBody = {
  fields: {
    role: { stringValue: "admin" },
    email: { stringValue: emailToPromote },
    uid: { stringValue: uid },
    displayName: { stringValue: "Admin" },
    createdAt: { timestampValue: isoNow },
    updatedAt: { timestampValue: isoNow },
  },
};

const firestoreResp = await fetch(
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?documentId=${uid}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(firestoreBody),
  }
);
const firestoreData = await firestoreResp.json();

if (firestoreResp.ok) {
  console.log(`✅ Admin user ready!`);
  console.log(`   Email:    ${emailToPromote}`);
  console.log(`   Password: ${password}`);
  console.log(`   UID:      ${uid}`);
} else {
  console.error("Firestore error:", JSON.stringify(firestoreData, null, 2));
  process.exit(1);
}
