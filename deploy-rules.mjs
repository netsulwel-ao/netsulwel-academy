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

// Read the rules file
const rulesContent = readFileSync(join(root, 'firestore.rules'), 'utf-8');
// Deploy
await admin.securityRules().releaseFirestoreRulesetFromSource(rulesContent);
console.log('Rules deployed successfully');

// Verify
const ruleset = await admin.securityRules().getFirestoreRuleset();
const content = ruleset.source[0].content;
const idx = content.indexOf('// ── lives');
console.log('Deployed rules (lives section):');
console.log(content.substring(idx, idx + 200));
