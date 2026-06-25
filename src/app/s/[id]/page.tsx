import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { Metadata } from "next";
import SalesPageClient from "./SalesPageClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const snap = await db.collection("courses").doc(id).get();
    if (!snap.exists) return { title: "Curso não encontrado" };
    const course = snap.data();
    return {
      title: `${course?.title} — Netsulwel Academy`,
      description: course?.description?.slice(0, 160) || "Curso online na Netsulwel Academy",
      openGraph: {
        title: course?.title,
        description: course?.description?.slice(0, 200),
        images: course?.thumbnail ? [{ url: course.thumbnail }] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: course?.title,
        description: course?.description?.slice(0, 200),
        images: course?.thumbnail ? [course.thumbnail] : [],
      },
    };
  } catch {
    return { title: "Netsulwel Academy" };
  }
}

export default async function SalesPage({ params }: Props) {
  const { id } = await params;
  return <SalesPageClient courseId={id} />;
}