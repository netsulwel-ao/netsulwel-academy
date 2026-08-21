"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, increment, updateDoc,
  setDoc, deleteDoc, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import PostTypeBadge from "./PostTypeBadge";
import type { CommunityPost } from "@/types/community";

// ── Helper timestamp ────────────────────────────────────────
function timeAgo(date: Date | unknown): string {
  const d = date instanceof Date ? date :
    (typeof date === "object" && date && "toDate" in date)
      ? (date as { toDate: () => Date }).toDate()
      : new Date(date as string);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "agora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return d.toLocaleDateString("pt-PT");
}

export default function PostCard({ post }: { post: CommunityPost }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "community", post.id, "likes", user.uid))
      .then(s => { if (s.exists()) setLiked(true); })
      .catch(() => {});
  }, [user?.uid, post.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLike = async () => {
    if (!user) return;
    const ref     = doc(db, "community", post.id, "likes", user.uid);
    const postRef = doc(db, "community", post.id);
    const wasLiked = liked;
    setLiked(!wasLiked); // optimistic
    try {
      if (wasLiked) {
        await deleteDoc(ref);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(ref, {});
        await updateDoc(postRef, { likesCount: increment(1) });
        if (post.authorId !== user.uid) {
          await setDoc(
            doc(db, "users", post.authorId, "notifications", `${post.id}_like_${user.uid}`),
            {
              uid: post.authorId,
              type: "community_like",
              title: "Novo gosto",
              message: `${user.displayName ?? "Alguém"} gostou do teu post "${post.title}"`,
              link: `/dashboard/community/${post.id}`,
              read: false,
              createdAt: serverTimestamp(),
            }
          );
        }
      }
    } catch {
      setLiked(wasLiked); // rollback
    }
  };

  return (
    <div className="group flex flex-col border border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-900 transition-all">
      <div className="p-4 sm:p-5 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/dashboard/community/profile/${post.authorId}`}
            className="flex items-center gap-2.5 min-w-0 group/author"
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden border border-gray-800">
              <Avatar uid={post.authorId} photoURL={post.authorPhoto} name={post.authorName} size={36} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-300 group-hover/author:text-white truncate transition-colors">
                {post.authorName}
              </p>
              <p className="font-mono text-[13px] text-gray-700">{timeAgo(post.createdAt)}</p>
            </div>
          </Link>
          <PostTypeBadge type={post.type} />
        </div>

        {/* ── Título ── */}
        <Link href={`/dashboard/community/${post.id}`} className="block">
          <h3 className="text-sm sm:text-base font-bold text-gray-200 hover:text-white transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {/* ── Preview do conteúdo ── */}
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
          {post.content}
        </p>

        {/* ── Imagens ── */}
        {post.images?.length > 0 && (
          <div className={`grid gap-1.5 overflow-hidden ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.images.slice(0, 4).map((img, i) => (
              <div key={i} className="relative aspect-video overflow-hidden bg-gray-900">
                <img src={img} alt={`Imagem ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* ── Tags ── */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map(tag => (
              <span key={tag} className="font-mono text-[13px] uppercase tracking-widest border border-gray-800 bg-gray-900 px-2 py-0.5 text-gray-700">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Acções ── */}
        <div className="flex items-center gap-5 pt-2 border-t border-gray-800">
          <button
            type="button"
            onClick={toggleLike}
            disabled={!user}
            className={`flex items-center gap-1.5 font-mono text-[13px] transition-colors disabled:opacity-40 ${
              liked ? "text-red-400" : "text-gray-700 hover:text-red-400"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-red-400" : ""}`} strokeWidth={1.5} />
            {post.likesCount ?? 0}
          </button>
          <Link
            href={`/dashboard/community/${post.id}`}
            className="flex items-center gap-1.5 font-mono text-[13px] text-gray-700 hover:text-blue-400/80 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            {post.commentsCount ?? 0}
          </Link>
        </div>
      </div>
    </div>
  );
}
