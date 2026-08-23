"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Users, Loader2, Filter, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CommunityPostType | "todas">("todas");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "community"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityPost)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = filter === "todas" ? posts : posts.filter((p) => p.type === filter);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-purple/10 border border-purple flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-light" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Comunidade</h1>
            </div>
            <p className="mt-2 text-gray-400">
              Dúvidas, projetos, discussões e dicas dos alunos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-3 font-bold transition-colors"
              >
                Nova Publicação
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-3 font-bold transition-colors"
              >
                <LogIn className="h-5 w-5" />
                Entrar para publicar
              </Link>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-gray-500 shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${
                filter === f.value
                  ? "bg-purple text-white"
                  : "bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-white"
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
            <div className="p-12 bg-gray-900 border border-gray-800 text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {filter === "todas" ? "Nenhuma publicação ainda" : "Nenhuma publicação com este filtro"}
              </h2>
              <p className="text-gray-400 max-w-md mx-auto">
                {filter === "todas"
                  ? "Sê o primeiro a publicar algo na comunidade!"
                  : "Tenta mudar o filtro."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {user && (
          <CreatePostModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => {}} />
        )}
      </div>
    </div>
  );
}
