import { getFirebaseAdmin } from "../src/lib/firebase-admin";

async function main() {
  try {
    const admin = getFirebaseAdmin();
    const uid = "HIfX2th3HjPGFnzccAuGpqyIiFI2";
    const ref = admin.firestore().doc("users/" + uid);
    const doc = await ref.get();

    if (!doc.exists) {
      console.log("Document does NOT exist. Creating...");
      await ref.set({
        email: "ekctiandrog@gmail.com",
        name: "Ekctiandro Gon\u00e7alo",
        role: "admin",
        plan: "golden",
        createdAt: new Date(),
      });
      console.log("Created admin document with role: admin");
    } else {
      const data = doc.data();
      if (!data) {
        console.log("Document exists but data() returned undefined, creating...");
        await ref.set({ role: "admin", plan: "golden", email: "ekctiandrog@gmail.com" });
        console.log("Created!");
      } else {
        console.log("Current data:", JSON.stringify(data, null, 2));
        if (data.role !== "admin" || data.plan !== "golden") {
          console.log("Updating role & plan...");
          await ref.update({ role: "admin", plan: "golden" });
          console.log("Updated!");
        } else {
          console.log("Admin doc is correct. No changes needed.");
        }
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
