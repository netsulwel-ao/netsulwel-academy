"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import {
  Users, MessageCircle, Heart, Trash2, ExternalLink, Loader2,
  Search, X, MessageSquare,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { CommunityPost } from "@/types/community";
import { toast } from "sonner";

export default function AdminCommunityPage() {
  const { isAdminOrTeacher } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "community"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityPost)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const handleDelete = async (postId: string) => {
    setConfirmDeleteId(null);
    setDeleting(postId);
    try {
      await deleteDoc(doc(db, "community", postId));
      toast.success("Publicação apagada com sucesso.");
    } catch {
      toast.error("Erro ao apagar publicação.");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = search.trim()
    ? posts.filter((p) =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.authorName?.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Comunidade</h1>
        <p className="mt-1 text-gray-400">Gerir publicações da comunidade</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total de publicações", value: posts.length, icon: Users, color: "purple" },
          { label: "Comentários", value: posts.reduce((a, p) => a + (p.commentsCount || 0), 0), icon: MessageCircle, color: "blue" },
          { label: "Gostos", value: posts.reduce((a, p) => a + (p.likesCount || 0), 0), icon: Heart, color: "red" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">{label}</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? <Loader2 className="h-7 w-7 animate-spin text-gray-600" /> : value}
              </p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center ${
              color === "purple" ? "bg-purple-500/10" : color === "blue" ? "bg-blue-500/10" : "bg-red-500/10"
            }`}>
              <Icon className={`h-6 w-6 ${
                color === "purple" ? "text-purple-400" : color === "blue" ? "text-blue-400" : "text-red-400"
              }`} />
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por título ou autor..."
          className="w-full bg-gray-900 border border-gray-800 focus:border-purple-500 py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} aria-label="Limpar pesquisa" className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={search ? "Nenhuma publicação encontrada" : "Nenhuma publicação na comunidade"}
          description={search ? "Tenta pesquisar por outro termo." : "As publicações dos alunos aparecerão aqui."}
          compact
        />
      ) : (
        <div className="bg-gray-900 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="flex items-center px-5 py-3 border-b border-gray-800 text-sm font-bold text-gray-500 uppercase tracking-wider">
                <span className="flex-[2]">Publicação</span>
                <span className="flex-1">Tipo</span>
                <span className="flex-1">Gostos</span>
                <span className="flex-1">Comentários</span>
                <span className="w-16"></span>
              </div>
              <div className="divide-y divide-gray-800">
                {filtered.map((post) => (
                  <div key={post.id} className="flex items-center px-5 py-4 hover:bg-gray-800 transition-colors group">
                    <div className="flex-[2] min-w-0 pr-2">
                      <p className="text-sm font-medium text-white truncate">{post.title}</p>
                      <p className="text-sm text-gray-500 truncate mt-0.5">{post.authorName} &middot; {post.authorId.substring(0, 8)}...</p>
                    </div>
                    <span className="flex-1 px-1">
                      <span className={`inline-flex items-center px-2 py-0.5 text-sm font-bold ${
                        post.type === "duvida" ? "text-amber-400 bg-amber-500/10" :
                        post.type === "projeto" ? "text-green-400 bg-green-500/10" :
                        post.type === "discussao" ? "text-blue-400 bg-blue-500/10" :
                        "text-purple-400 bg-purple-500/10"
                      }`}>
                        {post.type}
                      </span>
                    </span>
                    <span className="flex-1 flex items-center gap-1.5 text-sm text-gray-400 px-1">
                      <Heart className="h-3.5 w-3.5 text-gray-600" />
                      {post.likesCount || 0}
                    </span>
                    <span className="flex-1 flex items-center gap-1.5 text-sm text-gray-400 px-1">
                      <MessageCircle className="h-3.5 w-3.5 text-gray-600" />
                      {post.commentsCount || 0}
                    </span>
                    <div className="w-16 flex items-center gap-1 shrink-0">
                      <Link href={`/dashboard/community/${post.id}`} target="_blank"
                        className="p-1.5 text-gray-600 hover:text-blue-400 hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <button onClick={() => setConfirmDeleteId(post.id)} disabled={deleting === post.id}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30">
                        {deleting === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-gray-800 text-sm text-gray-500">
                {filtered.length} de {posts.length} publicações
              </div>
            </div>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-800">
            {filtered.map((post) => (
              <div key={post.id} className="px-4 py-4 space-y-2 hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{post.title}</p>
                    <p className="text-sm text-gray-500 truncate">{post.authorName}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 text-sm font-bold ${
                    post.type === "duvida" ? "text-amber-400 bg-amber-500/10" :
                    post.type === "projeto" ? "text-green-400 bg-green-500/10" :
                    post.type === "discussao" ? "text-blue-400 bg-blue-500/10" :
                    "text-purple-400 bg-purple-500/10"
                  }`}>
                    {post.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-gray-600" />{post.likesCount || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3 text-gray-600" />{post.commentsCount || 0}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link href={`/dashboard/community/${post.id}`} target="_blank"
                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
                    <ExternalLink className="h-3 w-3" /> Ver
                  </Link>
                  <button onClick={() => setConfirmDeleteId(post.id)} disabled={deleting === post.id}
                    className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 disabled:opacity-30">
                    {deleting === post.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Apagar
                  </button>
                </div>
              </div>
            ))}
            <div className="px-4 py-3 text-sm text-gray-500">
              {filtered.length} de {posts.length} publicações
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmação de apagar */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
          <div className="bg-gray-900 border border-gray-800 p-8 max-w-sm w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Apagar Publicação</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Tens a certeza que queres apagar esta publicação? Esta ação é irreversível.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex flex-1 items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 font-bold transition-colors"
              >
                Apagar
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex flex-1 items-center justify-center bg-gray-800 hover:bg-gray-700 text-white py-2.5 font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
