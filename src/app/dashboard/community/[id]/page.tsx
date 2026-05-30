"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
  const params = useParams();
  const id = params?.id as string;
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

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
    });
  }, [user, id]);

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

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      {/* Back */}
      <Link
        href="/dashboard/community"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à comunidade
      </Link>

      {/* Post */}
      <div className="bg-gray-900/40 border border-gray-800">
        <div className="p-6 sm:p-8 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <Link href={`/dashboard/community/profile/${post.authorId}`} className="flex items-center gap-3 group">
              {post.authorPhoto ? (
                <img src={post.authorPhoto} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-purple/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-light">{post.authorName?.[0]?.toUpperCase() || "?"}</span>
                </div>
              )}
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
                <div key={i} className="overflow-hidden bg-gray-800">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
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
          <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
            <span className={`flex items-center gap-1.5 text-sm ${liked ? "text-red-400" : "text-gray-500"}`}>
              <Heart className={`h-5 w-5 ${liked ? "fill-red-400" : ""}`} />
              {post.likesCount || 0} {post.likesCount === 1 ? "gosto" : "gostos"}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <span className="h-5 w-5 flex items-center justify-center text-base leading-none">💬</span>
              {post.commentsCount || 0} {post.commentsCount === 1 ? "comentário" : "comentários"}
            </span>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="mt-6 bg-gray-900/40 border border-gray-800 p-6 sm:p-8">
        <CommentSection postId={id} postAuthorId={post.authorId} postTitle={post.title} />
      </div>
    </div>
  );
}
