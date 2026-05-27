import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PreviewCourseClient from "./PreviewCourseClient";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

async function getCourse(id: string) {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/courses/${id}`,
      { next: { revalidate: 3600 } }
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
      type: f.type?.stringValue ?? "standalone",
      level: f.level?.stringValue ?? "beginner",
      category: f.category?.stringValue ?? "tech",
      price: f.price?.integerValue ?? f.price?.doubleValue ?? 0,
      hasCertificate: f.hasCertificate?.booleanValue ?? false,
      modulesCount: f.modulesCount?.integerValue ?? 0,
      lessonsCount: f.lessonsCount?.integerValue ?? 0,
      tags: f.tags?.arrayValue?.values?.map((v: { stringValue: string }) => v.stringValue) ?? [],
      modules: f.modules?.arrayValue?.values?.map((m: { mapValue: { fields: { title: { stringValue: string }; videos: { arrayValue: { values: { mapValue: { fields: { title: { stringValue: string }; duration: { stringValue: string } } } } }[] } } } }) => ({
        title: m.mapValue?.fields?.title?.stringValue ?? "",
        videos: m.mapValue?.fields?.videos?.arrayValue?.values?.map((v: { mapValue: { fields: { title: { stringValue: string }; duration: { stringValue: string } } } }) => ({
          title: v.mapValue?.fields?.title?.stringValue ?? "",
          duration: v.mapValue?.fields?.duration?.stringValue ?? "",
          // URL nunca exposta publicamente
        })) ?? [],
      })) ?? [],
      status: f.status?.stringValue ?? "draft",
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) return { title: "Curso não encontrado" };
  return {
    title: `${course.title} | Netsulwel Academy`,
    description: course.description || `Curso de ${course.category} na Netsulwel Academy.`,
    openGraph: {
      title: course.title,
      description: course.description,
      images: course.thumbnail ? [{ url: course.thumbnail, width: 1280, height: 720 }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description: course.description,
      images: course.thumbnail ? [course.thumbnail] : [],
    },
  };
}

export default async function PreviewCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course || course.status !== "published") notFound();
  return <PreviewCourseClient course={course} />;
}
