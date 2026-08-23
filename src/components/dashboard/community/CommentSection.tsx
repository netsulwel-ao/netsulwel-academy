"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, increment, updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { sendNotification, getCommentGroupKey } from "@/lib/notifications";
import { Send, Loader2, AlertCircle } from "lucide-react";
import type { CommunityComment } from "@/types/community";

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

export default function CommentSection({ postId, postAuthorId, postTitle }: { postId: string; postAuthorId: string; postTitle: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "community", postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityComment))
      );
    });
    return () => unsub();
  }, [postId]);

  const sendComment = async () => {
    if (!text.trim() || !user || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, "community", postId, "comments"), {
        authorId: user.uid,
        authorName: user.displayName || "Utilizador",
        authorPhoto: user.photoURL || "",
        content: text.trim(),
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "community", postId), {
        commentsCount: increment(1),
      });

      if (postAuthorId !== user.uid) {
        await sendNotification({
          uid: postAuthorId,
          type: "community_comment",
          title: "Novo comentário",
          message: `${user.displayName || "Alguém"} comentou no teu post "${postTitle}"`,
          link: `/dashboard/community/${postId}`,
          groupKey: getCommentGroupKey(postId),
        });
      }

      setText("");
    } catch (err) {
      console.error(err);
      setError("Erro ao enviar comentário.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">
        Comentários {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Comment list */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-sm text-gray-500 py-4 text-center">
            Nenhum comentário ainda. Sê o primeiro!
          </p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 bg-gray-900 border border-gray-800 p-3">
            {comment.authorPhoto ? (
               <img src={comment.authorPhoto} alt={comment.authorName} className="h-8 w-8 rounded-full object-cover shrink-0 mt-0.5" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-purple/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold text-purple-light">{comment.authorName?.[0]?.toUpperCase() || "?"}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{comment.authorName}</span>
                <span className="text-sm text-gray-600">{timeAgo(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 p-3 text-sm text-red-400 border border-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Input */}
      {user && (
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendComment();
              }
            }}
            placeholder="Escreve um comentário..."
            className="flex-1 border border-gray-700 bg-gray-950 py-2.5 px-3 text-white transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple text-sm"
          />
          <button
            onClick={sendComment}
            disabled={!text.trim() || sending}
            className="bg-purple hover:bg-purple-light text-white px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
