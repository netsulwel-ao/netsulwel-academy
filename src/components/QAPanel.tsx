"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, ThumbsUp, X, CheckCircle, Trash2 } from "lucide-react";
import type { LiveSession, QAQuestion } from "@/types/live";

interface QAPanelProps {
  liveId: string;
  isHost: boolean;
  hostName?: string;
}

/**
 * Q&A Panel component
 * Shows different UI for professors (manage questions) vs students (ask questions)
 */
export function QAPanel({ liveId, isHost, hostName }: QAPanelProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "answered" | "all">("pending");
  const [expandedAnswerId, setExpandedAnswerId] = useState<string | null>(null);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const questionsEndRef = useRef<HTMLDivElement>(null);

  // Load questions
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/livekit/qa/list?liveId=${liveId}&status=${selectedStatus}&sortBy=${
          isHost ? "newest" : "popular"
        }`
      );

      if (!res.ok) {
        throw new Error("Erro ao carregar perguntas");
      }

      const data = await res.json();
      setQuestions(data.questions);
    } catch (err) {
      console.error("Error loading questions:", err);
    } finally {
      setLoading(false);
    }
  }, [liveId, selectedStatus, isHost]);

  // Scroll to bottom when new questions arrive
  useEffect(() => {
    questionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [questions]);

  // Poll for new questions
  useEffect(() => {
    loadQuestions();
    const interval = setInterval(loadQuestions, 3000);
    return () => clearInterval(interval);
  }, [loadQuestions]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/livekit/qa/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveId,
          question: newQuestion,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar pergunta");
      }

      setNewQuestion("");
      loadQuestions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("Error asking question:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/livekit/qa/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveId,
          questionId,
          answer: answerText,
          action: "answer",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao responder");
      }

      setAnswerText("");
      setAnsweringId(null);
      loadQuestions();
    } catch (err) {
      console.error("Error submitting answer:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async (questionId: string) => {
    try {
      const res = await fetch("/api/livekit/qa/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveId,
          questionId,
          action: "dismiss",
        }),
      });

      if (!res.ok) throw new Error("Erro ao dispensar pergunta");

      loadQuestions();
    } catch (err) {
      console.error("Error dismissing question:", err);
    }
  };

  const handleUpvote = async (questionId: string, currentUpvotes: number) => {
    try {
      await fetch("/api/livekit/qa/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveId,
          questionId,
          action: "upvote",
        }),
      });

      loadQuestions();
    } catch (err) {
      console.error("Error upvoting:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1e] rounded-lg border border-white/8 overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-white/8">
        <h3 className="font-semibold text-white text-sm sm:text-base">
          P&R {!isHost && "ao Vivo"}
        </h3>
      </div>

      {/* Questions list */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3 sm:p-4">
        {loading && questions.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {questions.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-white/50 text-sm">
              {isHost ? "Nenhuma pergunta ainda" : "Seja o primeiro a perguntar"}
            </p>
          </div>
        )}

        {questions.map((question: any) => (
          <div
            key={question.id}
            className="bg-white/5 border border-white/8 rounded p-3 space-y-2 hover:bg-white/8 transition-colors"
          >
            {/* Question */}
            <div>
              <p className="text-xs text-white/50">
                {question.askedByName} • {new Date(question.askedAt).toLocaleTimeString("pt-PT")}
              </p>
              <p className="text-sm text-white mt-1">{question.question}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!isHost && (
                <button
                  onClick={() => handleUpvote(question.id, question.upvotes)}
                  className="flex items-center gap-1 text-xs text-white/50 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
                >
                  <ThumbsUp size={14} />
                  {question.upvotes}
                </button>
              )}

              {isHost && question.status === "pending" && (
                <>
                  <button
                    onClick={() => setAnsweringId(question.id)}
                    className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                  >
                    <Send size={14} />
                    Responder
                  </button>
                  <button
                    onClick={() => handleDismiss(question.id)}
                    className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white/70 px-2 py-1 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>

            {/* Answer input */}
            {isHost && answeringId === question.id && (
              <div className="mt-3 p-2 bg-white/5 rounded space-y-2">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Escrever resposta..."
                  className="w-full bg-white/10 text-white text-sm p-2 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmitAnswer(question.id)}
                    disabled={submitting || !answerText.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium py-1 rounded transition-colors"
                  >
                    Enviar Resposta
                  </button>
                  <button
                    onClick={() => {
                      setAnsweringId(null);
                      setAnswerText("");
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs py-1 rounded transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Answers */}
            {question.answers && question.answers.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/8 space-y-2">
                {question.answers.map((answer: any, idx: number) => (
                  <div key={idx} className="bg-white/5 p-2 rounded text-xs">
                    <div className="flex items-center gap-1 text-white/70 mb-1">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="font-medium">{answer.answeredByName}</span>
                    </div>
                    <p className="text-white/80">{answer.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div ref={questionsEndRef} />
      </div>

      {/* Question input - only for students */}
      {!isHost && (
        <form onSubmit={handleAskQuestion} className="border-t border-white/8 p-3 sm:p-4 space-y-2">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-xs p-2 rounded">
              {error}
            </div>
          )}
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Fazer uma pergunta..."
            className="w-full bg-white/10 text-white text-sm p-2 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={submitting || !newQuestion.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded text-sm transition-colors"
          >
            {submitting ? "Enviando..." : "Enviar Pergunta"}
          </button>
        </form>
      )}
    </div>
  );
}
