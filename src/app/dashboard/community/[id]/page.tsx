"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, getDoc, deleteDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, Heart, Trash2, Loader2, AlertCircle, CheckCircle2, MessageCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import PostTypeBadge from "@/components/dashboard/community/PostTypeBadge";
import CommentSection from "@/components/dashboard/community/CommentSection";
import type { CommunityPost } from "@/types/community";

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `há ${days}d`;
  return new Date(date).toLocaleDateString("pt-PT");
}

export default function CommunityPostDetailPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "community", id), (snap) => {
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() } as CommunityPost);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    getDoc(doc(db, "community", id, "likes", user.uid)).then((s) => {
      if (s.exists()) setLiked(true);
    }).catch(() => {});
  }, [user, id]);

  const toggleLike = async () => {
    if (!user || !post) return;
    const ref = doc(db, "community", id, "likes", user.uid);
    const postRef = doc(db, "community", id);
    const wasLiked = liked;
    setLiked(!liked);
    try {
      if (wasLiked) {
        await deleteDoc(ref);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(ref, {});
        await updateDoc(postRef, { likesCount: increment(1) });
        if (post.authorId !== user.uid) {
          await setDoc(doc(db, "users", post.authorId, "notifications", `${id}_like_${user.uid}`), {
            uid: post.authorId,
            type: "community_like",
            title: "Novo gosto",
            message: `${user.displayName || "Alguém"} gostou do teu post "${post.title}"`,
            link: `/dashboard/community/${id}`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch {
      setLiked(wasLiked);
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm("Tens a certeza que queres apagar esta publicação?")) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "community", id));
      router.push("/dashboard/community");
    } catch {
      setToast({ msg: "Erro ao apagar publicação.", type: "error" });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin border-2 border-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-white">Publicação não encontrada</h2>
        <Link href="/dashboard/community" className="mt-4 inline-flex items-center gap-2 text-purple-light hover:text-purple transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar à comunidade
        </Link>
      </div>
    );
  }

  const isOwner = user?.uid === post.authorId;
  const canDelete = isAdmin || isOwner;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      {toast && (
        <div role={toast.type === "error" ? "alert" : "status"} aria-live={toast.type === "error" ? "assertive" : "polite"} aria-atomic="true"
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 text-sm font-medium shadow-xl border ${
          toast.type === "success" ? "bg-green-500/10 border-green-500 text-green-400" : "bg-red-500/10 border-red-500 text-red-400"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)} aria-label="Fechar notificação"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Back */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard/community"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à comunidade
        </Link>
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Apagar
          </button>
        )}
      </div>

      {/* Post */}
      <div className="bg-gray-900 border border-gray-800">
        <div className="p-6 sm:p-8 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <Link href={`/dashboard/community/profile/${post.authorId}`} className="flex items-center gap-3 group">
              <div className="h-12 w-12 shrink-0 overflow-hidden border border-gray-800">
                <Avatar uid={post.authorId} photoURL={post.authorPhoto} name={post.authorName} size={48} />
              </div>
              <div>
                <p className="text-base font-semibold text-white group-hover:text-purple-light transition-colors">{post.authorName}</p>
                <p className="text-sm text-gray-500">{timeAgo(post.createdAt)}</p>
              </div>
            </Link>
            <PostTypeBadge type={post.type} />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
            {post.title}
          </h1>

          {/* Content */}
          <p className="text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className={`grid gap-3 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {post.images.map((img, i) => (
                <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="overflow-hidden bg-gray-800 block group">
                   <img src={img} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </a>
              ))}
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-sm text-gray-500 bg-gray-800 px-2 py-0.5">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-800">
            <button
              onClick={toggleLike}
              disabled={!user}
              className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${
                liked ? "text-red-400" : "text-gray-500 hover:text-red-400"
              }`}
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-red-400" : ""}`} />
              {post.likesCount || 0} {post.likesCount === 1 ? "gosto" : "gostos"}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <MessageCircle className="h-5 w-5" />
              {post.commentsCount || 0} {post.commentsCount === 1 ? "comentário" : "comentários"}
            </span>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="mt-6 bg-gray-900 border border-gray-800 p-6 sm:p-8">
        <CommentSection postId={id} postAuthorId={post.authorId} postTitle={post.title} />
      </div>
    </div>
  );
}
