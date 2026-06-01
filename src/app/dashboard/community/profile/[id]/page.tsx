"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { ArrowLeft, Calendar, Award, Loader2, Lock, Sparkles } from "lucide-react";
import PostCard from "@/components/dashboard/community/PostCard";
import type { CommunityPost } from "@/types/community";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileData {
  name: string;
  email: string;
  photoURL?: string;
  plan?: "free" | "smart" | "golden";
  createdAt?: Date;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "text-gray-400 bg-gray-800" },
  smart: { label: "Smart", color: "text-blue-400 bg-blue-500/10" },
  golden: { label: "Golden", color: "text-amber-400 bg-amber-500/10" },
};

export default function CommunityProfilePage() {
  const { user, plan, isAdmin } = useAuth();
  const params = useParams();
  const userId = params?.id as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const canAccess = isAdmin || plan === "smart" || plan === "golden";

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", userId));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({
            name: data.name || "Utilizador",
            email: data.email || "",
            photoURL: data.photoURL || "",
            plan: data.plan || "free",
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
          });
        }

        const postsSnap = await getDocs(
          query(
            collection(db, "community"),
            where("authorId", "==", userId),
            orderBy("createdAt", "desc")
          )
        );
        setPosts(
          postsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityPost))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-20 animate-in fade-in duration-500">
        <div className="bg-gray-900/40 border border-gray-800 p-10 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple to-purple-dark flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Conteúdo exclusivo</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            A comunidade é um benefício exclusivo para alunos dos planos <strong className="text-blue-400">Smart</strong> e <strong className="text-amber-400">Golden</strong>.
          </p>
          <Link
            href="/dashboard/finances"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple to-purple-dark hover:from-purple-light hover:to-purple text-white px-8 py-4 font-bold transition-all"
          >
            <Sparkles className="h-5 w-5" />
            Fazer Upgrade
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-white">Utilizador não encontrado</h2>
        <Link href="/dashboard/community" className="mt-4 inline-flex items-center gap-2 text-purple-light hover:text-purple transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar à comunidade
        </Link>
      </div>
    );
  }

  const planInfo = PLAN_LABELS[profile.plan || "free"];
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("pt-PT", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Back */}
      <Link
        href="/dashboard/community"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à comunidade
      </Link>

      {/* Profile Card */}
      <div className="bg-gray-900/40 border border-gray-800 p-6 sm:p-8">
        <div className="flex items-start gap-5">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="" className="h-20 w-20 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-purple/20 flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-purple-light">{profile.name[0]?.toUpperCase() || "?"}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
              <span className={`text-xs font-bold px-2 py-0.5 ${planInfo.color}`}>{planInfo.label}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Membro desde {memberSince}
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4" />
                {posts.length} {posts.length === 1 ? "publicação" : "publicações"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Publicações</h2>
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-8 bg-gray-900/30 border border-gray-800">
            Este utilizador ainda não fez nenhuma publicação.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
