/**
 * Firestore Security Rules Tests
 * Usa @firebase/rules-unit-testing para testar as rules localmente.
 *
 * Pré-requisito: Firebase Emulators instalados e a correr:
 *   firebase emulators:start --only firestore
 *
 * Executar: npx vitest run src/__tests__/rules/
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  doc, getDoc, setDoc, updateDoc,
  collection, addDoc,
} from "firebase/firestore";

const PROJECT_ID = "test-netsulwel-academy";
const RULES_PATH = resolve(__dirname, "../../../firestore.rules");

let testEnv: RulesTestEnvironment;
let emulatorAvailable = false;

// ── Verificar disponibilidade do emulator ──────────────────
async function checkEmulatorAvailable(): Promise<boolean> {
  try {
    const response = await fetch("http://127.0.0.1:8080/");
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

// ── Setup ──────────────────────────────────────────────────
beforeAll(async () => {
  emulatorAvailable = await checkEmulatorAvailable();
  if (!emulatorAvailable) return;

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  if (testEnv) await testEnv.clearFirestore();
});

// ── Helpers ────────────────────────────────────────────────
function asAdmin() {
  return testEnv.authenticatedContext("admin_uid", { sub: "admin_uid" });
}

function asTeacher(uid = "teacher_uid") {
  return testEnv.authenticatedContext(uid, { sub: uid });
}

function asStudent(uid = "student_uid") {
  return testEnv.authenticatedContext(uid, { sub: uid });
}

function asAnonymous() {
  return testEnv.unauthenticatedContext();
}

async function setupUserRole(uid: string, role: string, plan = "free") {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "users", uid), { role, plan });
  });
}

// ── Tests ──────────────────────────────────────────────────
// skipIf: salta o suite inteiro quando o emulator não está a correr.
// Para ativar: firebase emulators:start --only firestore

const describeEmulator = describe.skipIf(() => !emulatorAvailable);

describeEmulator("users collection", () => {
  it("utilizador autenticado pode ler qualquer perfil", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "other_user"), { role: "aluno" });
    });
    const db = asStudent().firestore();
    await assertSucceeds(getDoc(doc(db, "users", "other_user")));
  });

  it("anónimo NÃO pode ler perfis", async () => {
    const db = asAnonymous().firestore();
    await assertFails(getDoc(doc(db, "users", "any_user")));
  });

  it("utilizador NÃO pode alterar o próprio role", async () => {
    await setupUserRole("student_uid", "aluno");
    const db = asStudent().firestore();
    await assertFails(
      updateDoc(doc(db, "users", "student_uid"), { role: "admin" })
    );
  });

  it("utilizador NÃO pode alterar o próprio plan diretamente", async () => {
    await setupUserRole("student_uid", "aluno", "free");
    const db = asStudent().firestore();
    await assertFails(
      updateDoc(doc(db, "users", "student_uid"), { plan: "golden" })
    );
  });

  it("admin pode atualizar qualquer utilizador incluindo role", async () => {
    await setupUserRole("admin_uid", "admin");
    await setupUserRole("student_uid", "aluno");
    const db = asAdmin().firestore();
    await assertSucceeds(
      updateDoc(doc(db, "users", "student_uid"), { role: "teacher" })
    );
  });
});

describeEmulator("courses collection", () => {
  beforeEach(async () => {
    await setupUserRole("admin_uid", "admin");
    await setupUserRole("teacher_uid", "teacher");
    await setupUserRole("student_uid", "aluno");
  });

  it("aluno pode ler curso publicado", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "courses", "course_1"), {
        status: "published", createdBy: "teacher_uid",
      });
    });
    const db = asStudent().firestore();
    await assertSucceeds(getDoc(doc(db, "courses", "course_1")));
  });

  it("aluno NÃO pode ler curso draft", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "courses", "course_draft"), {
        status: "draft", createdBy: "teacher_uid",
      });
    });
    const db = asStudent().firestore();
    await assertFails(getDoc(doc(db, "courses", "course_draft")));
  });

  it("teacher pode criar curso", async () => {
    const db = asTeacher().firestore();
    await assertSucceeds(
      addDoc(collection(db, "courses"), {
        title: "Novo Curso",
        status: "draft",
        createdBy: "teacher_uid",
      })
    );
  });

  it("teacher pode editar o próprio curso", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "courses", "my_course"), {
        title: "Meu Curso",
        status: "draft",
        createdBy: "teacher_uid",
      });
    });
    const db = asTeacher().firestore();
    await assertSucceeds(
      updateDoc(doc(db, "courses", "my_course"), { title: "Curso Atualizado" })
    );
  });

  it("teacher NÃO pode editar curso de outro teacher", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "courses", "other_course"), {
        title: "Curso Alheio",
        status: "draft",
        createdBy: "other_teacher_uid",
      });
    });
    const db = asTeacher().firestore();
    await assertFails(
      updateDoc(doc(db, "courses", "other_course"), { title: "Hackeado" })
    );
  });

  it("aluno NÃO pode criar curso", async () => {
    const db = asStudent().firestore();
    await assertFails(
      addDoc(collection(db, "courses"), { title: "Invasão", createdBy: "student_uid" })
    );
  });
});

describeEmulator("progress subcollection", () => {
  beforeEach(async () => {
    await setupUserRole("student_uid", "aluno");
    await setupUserRole("teacher_uid", "teacher");
  });

  it("aluno pode escrever o seu próprio progresso", async () => {
    const db = asStudent().firestore();
    await assertSucceeds(
      setDoc(doc(db, "progress", "student_uid", "courses", "course_1"), {
        userId: "student_uid",
        completedCount: 3,
        lastAccessedAt: new Date(),
      })
    );
  });

  it("aluno pode ler o seu próprio progresso", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "progress", "student_uid", "courses", "course_1"), {
        userId: "student_uid",
        completedCount: 3,
      });
    });
    const db = asStudent().firestore();
    await assertSucceeds(
      getDoc(doc(db, "progress", "student_uid", "courses", "course_1"))
    );
  });

  it("aluno NÃO pode ler progresso de outro aluno", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "progress", "other_student", "courses", "course_1"), {
        userId: "other_student",
      });
    });
    const db = asStudent().firestore();
    await assertFails(
      getDoc(doc(db, "progress", "other_student", "courses", "course_1"))
    );
  });

  it("teacher pode ler progresso dos alunos", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "progress", "student_uid", "courses", "course_1"), {
        userId: "student_uid",
      });
    });
    const db = asTeacher().firestore();
    await assertSucceeds(
      getDoc(doc(db, "progress", "student_uid", "courses", "course_1"))
    );
  });
});

describeEmulator("certificates subcollection", () => {
  beforeEach(async () => {
    await setupUserRole("student_uid", "aluno");
  });

  it("aluno pode criar o próprio certificado", async () => {
    const db = asStudent().firestore();
    await assertSucceeds(
      setDoc(doc(db, "certificates", "student_uid", "courses", "course_1"), {
        userId: "student_uid",
        courseTitle: "Curso Teste",
        completedAt: new Date(),
      })
    );
  });

  it("aluno pode ler o próprio certificado", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "certificates", "student_uid", "courses", "course_1"), {
        userId: "student_uid",
      });
    });
    const db = asStudent().firestore();
    await assertSucceeds(
      getDoc(doc(db, "certificates", "student_uid", "courses", "course_1"))
    );
  });

  it("aluno NÃO pode ler certificados de outro aluno", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "certificates", "other_student", "courses", "course_1"), {
        userId: "other_student",
      });
    });
    const db = asStudent().firestore();
    await assertFails(
      getDoc(doc(db, "certificates", "other_student", "courses", "course_1"))
    );
  });
});

describeEmulator("notifications subcollection", () => {
  beforeEach(async () => {
    await setupUserRole("student_uid", "aluno");
  });

  it("aluno pode criar notificação do tipo permitido na sua subcoleção", async () => {
    const db = asStudent().firestore();
    await assertSucceeds(
      addDoc(collection(db, "users", "student_uid", "notifications"), {
        uid: "student_uid",
        type: "community_like",
        title: "Novo gosto",
        message: "Alguém gostou",
        read: false,
        createdAt: new Date(),
      })
    );
  });

  it("aluno NÃO pode criar notificação com type não permitido", async () => {
    const db = asStudent().firestore();
    await assertFails(
      addDoc(collection(db, "users", "student_uid", "notifications"), {
        uid: "student_uid",
        type: "admin_alert",
        title: "Hack",
        read: false,
        createdAt: new Date(),
      })
    );
  });

  it("aluno NÃO pode criar notificação na subcoleção de outro utilizador", async () => {
    const db = asStudent().firestore();
    await assertFails(
      addDoc(collection(db, "users", "another_uid", "notifications"), {
        uid: "another_uid",
        type: "community_like",
        read: false,
        createdAt: new Date(),
      })
    );
  });
});

describeEmulator("sales collection", () => {
  beforeEach(async () => {
    await setupUserRole("student_uid", "aluno");
    await setupUserRole("admin_uid", "admin");
    await setupUserRole("teacher_uid", "teacher");
  });

  it("aluno NÃO pode alterar o status de uma venda", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "sales", "sale_1"), {
        userId: "student_uid",
        status: "pending",
        amount: 5000,
      });
    });
    const db = asStudent().firestore();
    await assertFails(
      updateDoc(doc(db, "sales", "sale_1"), { status: "confirmed" })
    );
  });

  it("admin pode confirmar uma venda", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "sales", "sale_1"), {
        userId: "student_uid",
        status: "pending",
      });
    });
    const db = asAdmin().firestore();
    await assertSucceeds(
      updateDoc(doc(db, "sales", "sale_1"), { status: "confirmed" })
    );
  });
});
