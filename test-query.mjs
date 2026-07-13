import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const files = ['netsulwel-academy-firebase-adminsdk-fbsvc-aad186c64e.json'];
let sa = null;
for (const f of files) {
  const fp = join(root, f);
  if (existsSync(fp)) { sa = JSON.parse(readFileSync(fp, 'utf-8')); break; }
}
if (!sa) { console.error('SA not found at', root); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(sa) });

const email = 'firestore-test@netsulwel.tech';
const password = 'test123456';

try {
  await admin.auth().getUserByEmail(email);
} catch {
  await admin.auth().createUser({ email, password, displayName: 'Firestore Test' });
}

const apiKey = 'AIzaSyDk0J8Qsu1xGu7YbgcP_tpMh1YMP4jrJso';
const signInRes = await fetch(
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + apiKey,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  }
);
const signInData = await signInRes.json();
if (signInData.error) {
  console.log('Sign in error:', signInData.error.message);
  process.exit(1);
}
console.log('Signed in, got ID token');

const idToken = signInData.idToken;

// Test 1: Simple query with orderBy only
console.log('\n--- Test 1: orderBy only (no where) ---');
const r1 = await fetch(
  'https://firestore.googleapis.com/v1/projects/netsulwel-academy/databases/(default)/documents/lives?orderBy=scheduledAt%20desc&pageSize=5',
  {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + idToken }
  }
);
const d1 = await r1.json();
console.log('Status:', r1.status);
if (d1.error) {
  console.log('Error:', JSON.stringify(d1.error));
} else {
  console.log('Docs found:', d1.documents?.length || 0);
  if (d1.documents) {
    d1.documents.forEach(d => {
      const name = d.name.split('/').pop();
      const f = d.fields;
      console.log(' -', name, f.title?.stringValue?.slice(0,30), f.status?.stringValue);
    });
  }
}

// Test 2: query with where("status","in", [...]) + orderBy
console.log('\n--- Test 2: where in + orderBy (old query) ---');
const r2 = await fetch(
  'https://firestore.googleapis.com/v1/projects/netsulwel-academy/databases/(default)/documents:runQuery',
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + idToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'lives' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'status' },
            op: 'IN',
            value: {
              arrayValue: {
                values: [
                  { stringValue: 'scheduled' },
                  { stringValue: 'live' },
                  { stringValue: 'ended' }
                ]
              }
            }
          }
        },
        orderBy: [{ field: { fieldPath: 'scheduledAt' }, direction: 'DESCENDING' }],
        limit: 5
      }
    })
  }
);
const d2 = await r2.json();
console.log('Status:', r2.status);
if (d2.error) {
  console.log('Error:', JSON.stringify(d2.error));
} else {
  const docs = d2.filter(r => r.document);
  console.log('Docs found:', docs.length);
  docs.forEach(r => {
    const d = r.document;
    const name = d.name.split('/').pop();
    const f = d.fields;
    console.log(' -', name, f.title?.stringValue?.slice(0,30), f.status?.stringValue);
  });
}
