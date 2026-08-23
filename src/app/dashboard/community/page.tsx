"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Loader2, Filter, MessageSquare } from "lucide-react";
import PostCard from "@/components/dashboard/community/PostCard";
import CreatePostModal from "@/components/dashboard/community/CreatePostModal";
import type { CommunityPost, CommunityPostType } from "@/types/community";

const FILTERS: { label: string; value: CommunityPostType | "todas" }[] = [
  { label: "Todas",      value: "todas"     },
  { label: "Dúvidas",    value: "duvida"    },
  { label: "Projetos",   value: "projeto"   },
  { label: "Discussões", value: "discussao" },
  { label: "Dicas",      value: "dica"      },
];

export default function DashboardCommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CommunityPostType | "todas">("todas");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "community"), orderBy("createdAt", "desc")),
      snap => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost)));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const filtered = filter === "todas" ? posts : posts.filter(p => p.type === filter);

  return (
    <div className="max-w-[80rem] mx-auto space-y-6 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple mb-2">
            // comunidade
          </p>
          <h1 className="text-2xl font-bold text-gray-100">Comunidade</h1>
          <p className="mt-1 text-sm text-gray-600">
            {loading ? "A carregar..." : `${posts.length} publicação${posts.length !== 1 ? "ões" : ""}`}
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-purple px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-light transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nova publicação
          </button>
        )}
      </div>

      {/* ── Filtros ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-3.5 w-3.5 text-gray-700 shrink-0" strokeWidth={1.5} />
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`shrink-0 border px-3 py-1.5 font-mono text-[13px] uppercase tracking-widest transition-colors ${
              filter === f.value
                ? "border-purple bg-purple/15 text-purple"
                : "border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Conteúdo ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <MessageSquare className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
            // sem publicações
          </p>
          <p className="text-sm text-gray-600 mb-5">
            {filter !== "todas"
              ? "Nenhuma publicação com este filtro."
              : "Sê o primeiro a publicar algo."}
          </p>
          <div className="flex gap-3">
            {user && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:border-purple hover:text-purple transition-all"
              >
                <Plus className="h-3 w-3" /> Publicar
              </button>
            )}
            {filter !== "todas" && (
              <button
                type="button"
                onClick={() => setFilter("todas")}
                className="border border-gray-800 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:border-gray-700 hover:text-gray-400 transition-all"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* ── Modal de criação ── */}
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
