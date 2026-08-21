import { db } from "@/lib/firebase";
import {
  doc, getDoc, setDoc, collection, query, where, orderBy, onSnapshot, serverTimestamp, limit, updateDoc, arrayUnion, increment, writeBatch, type FieldValue,
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
  } catch (e: unknown) {
    console.error("[DEBUG] getDoc FAILED:", (e as Record<string, unknown>)?.code, (e as Error)?.message);
    throw e;
  }

  if (snap.exists()) {
    return chatId;
  }

  const data: Omit<CourseChat, "id" | "createdAt"> & { createdAt: FieldValue } = {
    type: "group",
    courseId,
    courseTitle,
    createdBy: participants[0] || "",
    createdAt: serverTimestamp() as FieldValue,
    participants,
    participantNames,
    participantPhotos,
  };

  console.log("[DEBUG] setDoc — data.participants:", participants, "createdBy:", participants[0]);
  try {
    await setDoc(ref, data);
    console.log("[DEBUG] setDoc OK");
  } catch (e: unknown) {
    console.error("[DEBUG] setDoc FAILED:", (e as Record<string, unknown>)?.code, (e as Error)?.message);
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

  const data: Omit<CourseChat, "id" | "createdAt"> & { createdAt: FieldValue } = {
    type: "individual",
    courseId,
    courseTitle,
    createdBy: teacherUid,
    createdAt: serverTimestamp() as FieldValue,
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

  // Buscar participantes para incrementar unread
  const chatSnap = await getDoc(chatRef);
  const chatData = chatSnap.exists() ? chatSnap.data() as CourseChat : null;
  const otherParticipants = chatData?.participants.filter(p => p !== uid) ?? [];

  const batch = writeBatch(db);

  // Adicionar mensagem
  const msgRef = doc(messagesRef);
  batch.set(msgRef, {
    chatId,
    uid,
    displayName,
    photoURL: photoURL || null,
    text,
    type: "text",
    createdAt: serverTimestamp(),
  });

  // Atualizar chat: lastMessage + unreadBy
  const updates: Record<string, unknown> = {
    lastMessage: text.slice(0, 120),
    lastMessageAt: serverTimestamp(),
    lastMessageBy: uid,
    lastMessageByName: displayName,
  };
  otherParticipants.forEach(p => {
    updates[`unreadBy.${p}`] = increment(1);
  });
  batch.update(chatRef, updates);

  await batch.commit();
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

/** Marcar um chat como lido para o utilizador (reseta unread para 0) */
export async function markChatAsRead(chatId: string, uid: string) {
  const chatRef = doc(db, "courseChats", chatId);
  await updateDoc(chatRef, {
    [`unreadBy.${uid}`]: 0,
  });
}

/** Escuta o total de mensagens não lidas do utilizador em todos os seus chats */
export function listenUnreadCount(uid: string, callback: (total: number) => void) {
  const q = query(
    collection(db, "courseChats"),
    where("participants", "array-contains", uid),
  );

  return onSnapshot(q, (snap) => {
    let total = 0;
    snap.docs.forEach(d => {
      const data = d.data();
      const unreadBy = data.unreadBy as Record<string, number> | undefined;
      if (unreadBy && unreadBy[uid]) {
        total += unreadBy[uid];
      }
    });
    callback(total);
  });
}
