import { getFirebaseAdmin } from "../src/lib/firebase-admin";

const email = process.argv[2];
if (!email) { console.error("Uso: npx tsx scripts/make-admin.ts <email>"); process.exit(1); }

const admin = getFirebaseAdmin();
try {
  const user = await admin.auth().getUserByEmail(email);
  await admin.firestore().collection("users").doc(user.uid).update({ role: "admin" });
  console.log(`✓ ${email} (${user.uid}) → admin`);
} catch (err) {
  console.error("Erro:", err.message);
  process.exit(1);
}
