import { db } from "@/lib/firebase";
import {
  doc, getDoc, setDoc, addDoc, collection, query, where, orderBy, onSnapshot, serverTimestamp, limit, updateDoc, arrayUnion,
} from "firebase/firestore";
import type { CourseChat, ChatMessage } from "@/types/chat";

/** ID determinístico para chat de grupo de um curso */
export function groupChatId(courseId: string) {
  return `course_${courseId}`;
}

/** ID determinístico para chat individual aluno-professor num curso */
export function individualChatId(courseId: string, teacherUid: string, studentUid: string) {
  const parts = [teacherUid, studentUid].sort();
  return `indiv_${courseId}_${parts[0]}_${parts[1]}`;
}

/** Busca ou cria o chat de grupo de um curso */
export async function getOrCreateGroupChat(courseId: string, courseTitle: string, participants: string[], participantNames: Record<string, string>, participantPhotos: Record<string, string>) {
  const chatId = groupChatId(courseId);
  const ref = doc(db, "courseChats", chatId);

  console.log("[DEBUG] getOrCreateGroupChat — getDoc:", chatId);
  let snap;
  try {
    snap = await getDoc(ref);
    console.log("[DEBUG] getDoc OK — exists:", snap.exists());
  } catch (e: any) {
    console.error("[DEBUG] getDoc FAILED:", e?.code, e?.message);
    throw e;
  }

  if (snap.exists()) {
    return chatId;
  }

  const data: Omit<CourseChat, "id"> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    type: "group",
    courseId,
    courseTitle,
    createdBy: participants[0] || "",
    createdAt: serverTimestamp() as any,
    participants,
    participantNames,
    participantPhotos,
  };

  console.log("[DEBUG] setDoc — data.participants:", participants, "createdBy:", participants[0]);
  try {
    await setDoc(ref, data);
    console.log("[DEBUG] setDoc OK");
  } catch (e: any) {
    console.error("[DEBUG] setDoc FAILED:", e?.code, e?.message);
    throw e;
  }

  return chatId;
}

/** Busca ou cria um chat individual */
export async function getOrCreateIndividualChat(
  courseId: string, courseTitle: string,
  teacherUid: string, teacherName: string, teacherPhoto: string | undefined,
  studentUid: string, studentName: string, studentPhoto: string | undefined,
) {
  const chatId = individualChatId(courseId, teacherUid, studentUid);
  const ref = doc(db, "courseChats", chatId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return chatId;
  }

  const participants = [teacherUid, studentUid];
  const participantNames: Record<string, string> = {
    [teacherUid]: teacherName,
    [studentUid]: studentName,
  };
  const participantPhotos: Record<string, string> = {};
  if (teacherPhoto) participantPhotos[teacherUid] = teacherPhoto;
  if (studentPhoto) participantPhotos[studentUid] = studentPhoto;

  const data: Omit<CourseChat, "id"> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    type: "individual",
    courseId,
    courseTitle,
    createdBy: teacherUid,
    createdAt: serverTimestamp() as any,
    participants,
    participantNames,
    participantPhotos,
  };
  await setDoc(ref, data);
  return chatId;
}

/** Enviar uma mensagem */
export async function sendMessage(chatId: string, uid: string, displayName: string, photoURL: string | undefined, text: string) {
  const messagesRef = collection(db, "courseChats", chatId, "messages");
  const chatRef = doc(db, "courseChats", chatId);

  await addDoc(messagesRef, {
    chatId,
    uid,
    displayName,
    photoURL: photoURL || null,
    text,
    type: "text",
    createdAt: serverTimestamp(),
  });

  await updateDoc(chatRef, {
    lastMessage: text.slice(0, 120),
    lastMessageAt: serverTimestamp(),
    lastMessageBy: uid,
    lastMessageByName: displayName,
  });
}

/** Escuta mensagens em tempo real */
export function listenMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
  const q = query(
    collection(db, "courseChats", chatId, "messages"),
    orderBy("createdAt", "asc"),
    limit(200),
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
    callback(msgs);
  });
}

/**
 * Escuta chats do utilizador em tempo real (para listagem).
 * Tenta primeiro com orderBy (requer índice composto).
 * Se o índice não existir, faz fallback sem orderBy e ordena em memória.
 */
export function listenUserChats(uid: string, callback: (chats: CourseChat[]) => void) {
  // Ordenar em memória por lastMessageAt desc
  const sortChats = (chats: CourseChat[]) =>
    [...chats].sort((a, b) => {
      const getMs = (v: unknown): number => {
        if (!v) return 0;
        if (v instanceof Date) return v.getTime();
        if (typeof v === "object" && "toDate" in (v as object)) {
          return (v as { toDate: () => Date }).toDate().getTime();
        }
        return 0;
      };
      return getMs(b.lastMessageAt) - getMs(a.lastMessageAt);
    });

  // Tenta com índice composto
  const q = query(
    collection(db, "courseChats"),
    where("participants", "array-contains", uid),
    orderBy("lastMessageAt", "desc"),
  );

  let unsubFallback: (() => void) | null = null;

  const unsub = onSnapshot(
    q,
    (snap) => {
      const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseChat));
      callback(chats);
    },
    (err) => {
      // Índice não existe — fallback sem orderBy
      if (err.code === "failed-precondition" || err.code === "unimplemented") {
        const qFallback = query(
          collection(db, "courseChats"),
          where("participants", "array-contains", uid),
        );
        unsubFallback = onSnapshot(qFallback, (snap) => {
          const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseChat));
          callback(sortChats(chats));
        });
      }
    }
  );

  return () => {
    unsub();
    unsubFallback?.();
  };
}

/**
 * Adiciona um aluno a um chat de grupo existente (se existir).
 * Chamado após matrícula num curso.
 */
export async function addStudentToGroupChat(
  courseId: string,
  studentUid: string,
  studentName: string,
  studentPhoto?: string,
) {
  const chatId = groupChatId(courseId);
  const ref = doc(db, "courseChats", chatId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return; // ainda não tem chat, nada a fazer

  const data = snap.data() as CourseChat;
  if (data.participants.includes(studentUid)) return; // já é participante

  const updates: Record<string, unknown> = {
    participants: arrayUnion(studentUid),
    [`participantNames.${studentUid}`]: studentName,
  };
  if (studentPhoto) {
    updates[`participantPhotos.${studentUid}`] = studentPhoto;
  }
  await updateDoc(ref, updates);
}
