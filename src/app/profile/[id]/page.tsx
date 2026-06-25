"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useProfile, ProfileContent } from "@/components/ProfileContent";

export default function ProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const { profile, courses, lives, loading } = useProfile(userId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Utilizador não encontrado</h2>
        <Link href="/" className="text-purple hover:text-purple-light transition-colors">Voltar ao início</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileContent
        profile={profile}
        courses={courses}
        lives={lives}
        courseHref={(id) => `/preview/course/${id}`}
        contentClassName="max-w-6xl mx-auto px-4 sm:px-6"
      />
    </div>
  );
}
