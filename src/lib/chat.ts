import { db } from "@/lib/firebase";
import {
  doc, getDoc, setDoc, addDoc, collection, query, where, orderBy, onSnapshot, serverTimestamp, limit, updateDoc,
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
  const snap = await getDoc(ref);

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
  await setDoc(ref, data);
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

/** Escuta chats do utilizador em tempo real (para listagem) */
export function listenUserChats(uid: string, callback: (chats: CourseChat[]) => void) {
  const q = query(
    collection(db, "courseChats"),
    where("participants", "array-contains", uid),
    orderBy("lastMessageAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseChat));
    callback(chats);
  });
}
