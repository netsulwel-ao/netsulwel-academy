"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import {
  Users, MessageCircle, Heart, Trash2, ExternalLink, Loader2,
  Search, X,
} from "lucide-react";
import type { CommunityPost } from "@/types/community";
import { toast } from "sonner";

export default function AdminCommunityPage() {
  const router = useRouter();
  const { isAdminOrTeacher } = useAuth();

  useEffect(() => {
    if (!isAdminOrTeacher) router.replace("/dashboard");
  }, [isAdminOrTeacher, router]);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "community"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityPost)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const handleDelete = async (postId: string) => {
    if (!confirm("Tens a certeza que queres apagar esta publicação?")) return;
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
        <h1 className="text-3xl font-bold text-white">Comunidade</h1>
        <p className="mt-1 text-gray-400">Gerir publicações da comunidade</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total de publicações", value: posts.length, icon: Users, color: "purple" },
          { label: "Comentários", value: posts.reduce((a, p) => a + (p.commentsCount || 0), 0), icon: MessageCircle, color: "blue" },
          { label: "Gostos", value: posts.reduce((a, p) => a + (p.likesCount || 0), 0), icon: Heart, color: "red" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900/40 backdrop-blur-xl p-5 flex items-center justify-between">
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
          className="w-full bg-gray-900 border border-gray-800 focus:border-purple-500/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 text-gray-500 hover:text-white">
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
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900/40 text-center">
          <Users className="h-12 w-12 text-gray-700 mb-3" />
          <p className="text-gray-400 font-medium">
            {search ? "Nenhuma publicação encontrada" : "Nenhuma publicação na comunidade"}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900/40 backdrop-blur-xl overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="grid grid-cols-[1fr_120px_100px_100px_80px] gap-4 px-5 py-3 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Publicação</span>
              <span>Tipo</span>
              <span>Gostos</span>
              <span>Comentários</span>
              <span></span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-800/60">
              {filtered.map((post) => (
                <div key={post.id} className="grid grid-cols-[1fr_120px_100px_100px_80px] gap-4 px-5 py-4 items-center hover:bg-gray-800/30 transition-colors group">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{post.title}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{post.authorName} &middot; {post.authorId.substring(0, 8)}...</p>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold w-fit ${
                    post.type === "duvida" ? "text-amber-400 bg-amber-500/10" :
                    post.type === "projeto" ? "text-green-400 bg-green-500/10" :
                    post.type === "discussao" ? "text-blue-400 bg-blue-500/10" :
                    "text-purple-400 bg-purple-500/10"
                  }`}>
                    {post.type}
                  </span>

                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Heart className="h-3.5 w-3.5 text-gray-600" />
                    {post.likesCount || 0}
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <MessageCircle className="h-3.5 w-3.5 text-gray-600" />
                    {post.commentsCount || 0}
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/dashboard/community/${post.id}`}
                      target="_blank"
                      className="p-1.5 text-gray-600 hover:text-blue-400 hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    >
                      {deleting === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-500">
              {filtered.length} de {posts.length} publicações
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
