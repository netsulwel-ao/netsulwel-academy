"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, CheckCircle2, XCircle, Loader2, Clock, ArrowRight } from "lucide-react";
import type { Exam, ExamResult } from "@/types/exam";

export default function StudentExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<(Exam & { id: string })[]>([]);
  const [results, setResults] = useState<Record<string, ExamResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "exams")));
        const allExams = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Exam & { id: string }));
        setExams(allExams);

        const resSnap = await getDocs(collection(db, "exam-results", user.uid, "exams"));
        const resMap: Record<string, ExamResult> = {};
        resSnap.forEach((d) => {
          const data = d.data() as ExamResult;
          resMap[d.id] = { ...data, id: d.id };
        });
        setResults(resMap);
      } catch { /* ok */ } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 bg-purple/10 border border-purple/20 flex items-center justify-center">
          <FileText className="h-6 w-6 text-purple-light" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Avaliações</h1>
          <p className="text-gray-400">Testes, quizzes e avaliações dos teus cursos.</p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="bg-gray-900/40 border border-gray-800 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhuma avaliação disponível</h2>
          <p className="text-gray-400 mb-6">Ainda não há avaliações publicadas para a tua conta.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/courses" className="bg-purple hover:bg-purple-light text-white px-5 py-3 font-bold transition-colors">
              Ver cursos
            </Link>
            <Link href="/dashboard" className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 font-bold transition-colors">
              Voltar ao início
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => {
            const result = results[exam.id];
            const attempts = result ? 1 : 0;
            const canRetry = !result || attempts < exam.maxAttempts;
            return (
              <div key={exam.id} className="bg-gray-900/40 border border-gray-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{exam.title}</h3>
                    {result && (
                      result.passed
                        ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                        : <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{exam.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{exam.questions.length} perguntas</span>
                    <span>Nota mínima: {exam.passingScore}%</span>
                    {exam.timeLimit && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {exam.timeLimit} min
                      </span>
                    )}
                    {result && (
                      <span className={result.passed ? "text-green-400" : "text-red-400"}>
                        {result.passed ? "Aprovado" : "Reprovado"} — {Math.round(result.score)}%
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={result && !canRetry ? `/dashboard/exams/${exam.id}/result` : `/dashboard/exams/${exam.id}`}
                  className={`flex items-center gap-2 px-5 py-3 font-bold transition-colors shrink-0 ${
                    result && !canRetry
                      ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                      : result
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-purple hover:bg-purple-light text-white"
                  }`}
                >
                  {result && !canRetry ? "Sem tentativas" : result ? "Tentar novamente" : "Começar"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
