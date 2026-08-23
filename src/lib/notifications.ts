import {
  doc, setDoc, serverTimestamp, getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NotificationType } from "@/types/notification";

interface SendNotificationParams {
  uid: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  groupKey?: string;
}

export async function sendNotification({
  uid,
  type,
  title,
  message,
  link,
  groupKey,
}: SendNotificationParams) {
  const docId = groupKey || `${type}_${Date.now()}_${uid}`;
  const notifRef = doc(db, "users", uid, "notifications", docId);

  try {
    const existing = await getDoc(notifRef);
    if (existing.exists()) {
      const data = existing.data();
      const prevCount = (data.count as number) || 1;
      const newCount = prevCount + 1;
      await setDoc(notifRef, {
        uid,
        type,
        title,
        message,
        link,
        read: false,
        count: newCount,
        createdAt: serverTimestamp(),
      }, { merge: true });
    } else {
      await setDoc(notifRef, {
        uid,
        type,
        title,
        message,
        link,
        read: false,
        count: 1,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("sendNotification error:", err);
  }
}

export function getCommentGroupKey(postId: string) {
  return `comment_${postId}`;
}

export function getLiveApprovedGroupKey(requestId: string) {
  return `live_approved_${requestId}`;
}

export function getLiveRejectedGroupKey(requestId: string) {
  return `live_rejected_${requestId}`;
}

export function getPaymentGroupKey(saleId: string) {
  return `payment_${saleId}`;
}

export function getInstitutionApprovedGroupKey(institutionId: string) {
  return `inst_approved_${institutionId}`;
}

export function getQuestionGroupKey(liveId: string, studentUid: string) {
  return `question_${liveId}_${studentUid}`;
}

export function getAnswerGroupKey(questionId: string) {
  return `answer_${questionId}`;
}
