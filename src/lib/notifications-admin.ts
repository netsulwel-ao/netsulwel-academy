import type { Firestore } from "firebase-admin/firestore";
import type { NotificationType } from "@/types/notification";

interface SendNotificationAdminParams {
  db: Firestore;
  uid: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  groupKey?: string;
}

export async function sendNotificationAdmin({
  db,
  uid,
  type,
  title,
  message,
  link,
  groupKey,
}: SendNotificationAdminParams) {
  const docId = groupKey || `${type}_${Date.now()}_${uid}`;
  const notifRef = db.collection("users").doc(uid).collection("notifications").doc(docId);

  try {
    const existing = await notifRef.get();
    if (existing.exists) {
      const data = existing.data()!;
      const prevCount = (data.count as number) || 1;
      const newCount = prevCount + 1;
      await notifRef.set({
        uid,
        type,
        title,
        message,
        link,
        read: false,
        count: newCount,
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } else {
      await notifRef.set({
        uid,
        type,
        title,
        message,
        link,
        read: false,
        count: 1,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("sendNotificationAdmin error:", err);
  }
}

export function getQuestionGroupKey(liveId: string, studentUid: string) {
  return `question_${liveId}_${studentUid}`;
}

export function getAnswerGroupKey(questionId: string) {
  return `answer_${questionId}`;
}

export function getInstitutionApprovedGroupKey(institutionId: string) {
  return `inst_approved_${institutionId}`;
}
