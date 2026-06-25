"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, onSnapshot,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Plus, Loader2, Filter, Lock, Sparkles } from "lucide-react";
import PostCard from "@/components/dashboard/community/PostCard";
import CreatePostModal from "@/components/dashboard/community/CreatePostModal";
import type { CommunityPost, CommunityPostType } from "@/types/community";

const FILTERS: { label: string; value: CommunityPostType | "todas" }[] = [
  { label: "Todas", value: "todas" },
  { label: "Dúvidas", value: "duvida" },
  { label: "Projetos", value: "projeto" },
  { label: "Discussões", value: "discussao" },
  { label: "Dicas", value: "dica" },
];

export default function DashboardCommunityPage() {
  const { user, plan, isAdmin } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CommunityPostType | "todas">("todas");
  const [showCreate, setShowCreate] = useState(false);

  const canAccess = isAdmin || plan === "smart" || plan === "golden";

  useEffect(() => {
    const q = query(
      collection(db, "community"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityPost))
      );
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = filter === "todas"
    ? posts
    : posts.filter((p) => p.type === filter);

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
            Faz upgrade do teu plano para ter acesso a discussões, projetos, dúvidas e dicas dos alunos.
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

  return (
    <div className="max-w-[100rem] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-purple/10 border border-purple/20 flex items-center justify-center shrink-0">
          <Users className="h-6 w-6 text-purple-light" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Comunidade</h1>
              <p className="mt-1 text-gray-400">
                Dúvidas, projetos, discussões e dicas dos alunos.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-3 font-bold transition-colors shrink-0"
            >
              <Plus className="h-5 w-5" />
              Nova Publicação
            </button>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-gray-500 shrink-0" />
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${
              filter === f.value
                ? "bg-purple text-white"
                : "bg-gray-900/40 text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 bg-gray-900/40 border border-gray-800 text-center">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              {filter === "todas" ? "Nenhuma publicação ainda" : "Nenhuma publicação com este filtro"}
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              {filter === "todas"
                ? "Sê o primeiro a publicar algo na comunidade!"
                : "Tenta mudar o filtro ou cria uma nova publicação."}
            </p>
            {filter === "todas" && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-6 inline-flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-3 font-bold transition-colors"
              >
                <Plus className="h-5 w-5" />
                Criar Publicação
              </button>
            )}
            {filter !== "todas" && (
              <button
                onClick={() => setFilter("todas")}
                className="mt-6 inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 font-bold transition-colors"
              >
                Limpar Filtro
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {user && (
        <CreatePostModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
}
