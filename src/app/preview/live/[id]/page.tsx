import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PreviewLiveClient from "./PreviewLiveClient";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

async function getLive(id: string) {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/lives/${id}`,
      { next: { revalidate: 60 } } // cache 1 min — lives mudam de status frequentemente
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.fields) return null;
    const f = data.fields;
    return {
      id,
      title: f.title?.stringValue ?? "",
      description: f.description?.stringValue ?? "",
      thumbnail: f.thumbnail?.stringValue ?? "",
      status: f.status?.stringValue ?? "scheduled",
      scheduledAt: f.scheduledAt?.stringValue ?? "",
      target: f.target?.stringValue ?? "all",
      hostName: f.hostName?.stringValue ?? "Professor",
      participantsCount: f.participantCount?.integerValue ?? 0,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const live = await getLive(id);
  if (!live) return { title: "Aula não encontrada" };
  const isLive = live.status === "live";
  return {
    title: `${isLive ? "🔴 AO VIVO: " : ""}${live.title} | Netsulwel Academy`,
    description: live.description || "Aula ao vivo na Netsulwel Academy.",
    openGraph: {
      title: live.title,
      description: live.description,
      images: live.thumbnail ? [{ url: live.thumbnail, width: 1280, height: 720 }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: live.title,
      description: live.description,
      images: live.thumbnail ? [live.thumbnail] : [],
    },
  };
}

export default async function PreviewLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const live = await getLive(id);
  if (!live) notFound();
  return <PreviewLiveClient live={live} />;
}
