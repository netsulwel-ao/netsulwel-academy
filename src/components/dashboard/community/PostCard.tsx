"use client";

import Link from "next/link";
import { Heart, MessageCircle, Image as ImageIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, increment, updateDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import PostTypeBadge from "./PostTypeBadge";
import type { CommunityPost } from "@/types/community";
import { useState, useEffect } from "react";

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d atrás`;
  return new Date(date).toLocaleDateString("pt-PT");
}

export default function PostCard({ post }: { post: CommunityPost }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!user) return;
    import("firebase/firestore").then(({ getDoc }) => {
      getDoc(doc(db, "community", post.id, "likes", user.uid)).then((s) => {
        if (s.exists()) setLiked(true);
      });
    });
  }, [user, post.id]);

  const toggleLike = async () => {
    if (!user) return;
    const ref = doc(db, "community", post.id, "likes", user.uid);
    const postRef = doc(db, "community", post.id);
    if (liked) {
      await deleteDoc(ref);
      await updateDoc(postRef, { likesCount: increment(-1) });
      setLiked(false);
    } else {
      await setDoc(ref, {});
      await updateDoc(postRef, { likesCount: increment(1) });
      setLiked(true);

      if (post.authorId !== user.uid) {
        await setDoc(doc(db, "users", post.authorId, "notifications", `${post.id}_like_${user.uid}`), {
          uid: post.authorId,
          type: "community_like",
          title: "Novo gosto",
          message: `${user.displayName || "Alguém"} gostou do teu post "${post.title}"`,
          link: `/dashboard/community/${post.id}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    }
  };

  return (
    <div className="bg-gray-900/40 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="p-5 space-y-4">
        {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <Link href={`/dashboard/community/profile/${post.authorId}`} className="flex items-center gap-3 min-w-0 group">
            {post.authorPhoto ? (
              <img src={post.authorPhoto} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-purple/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-purple-light">{post.authorName?.[0]?.toUpperCase() || "?"}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white group-hover:text-purple-light transition-colors truncate">{post.authorName}</p>
              <p className="text-xs text-gray-500">{timeAgo(post.createdAt)}</p>
            </div>
            </Link>
            <PostTypeBadge type={post.type} />
          </div>

        {/* Title */}
        <Link href={`/dashboard/community/${post.id}`} className="block">
          <h3 className="text-lg font-bold text-white hover:text-purple-light transition-colors leading-snug">
            {post.title}
          </h3>
        </Link>

        {/* Content preview */}
        <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className={`grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.images.slice(0, 4).map((img, i) => (
              <div key={i} className="relative overflow-hidden bg-gray-800 aspect-video">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-800/50">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              liked ? "text-red-400" : "text-gray-500 hover:text-red-400"
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-red-400" : ""}`} />
            {post.likesCount || 0}
          </button>
          <Link
            href={`/dashboard/community/${post.id}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-400 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {post.commentsCount || 0}
          </Link>
        </div>
      </div>
    </div>
  );
}
