"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp,
} from "firebase/firestore";
import { ChevronLeft, Plus, Trash2, Loader2, AlertCircle, BookOpen, Radio } from "lucide-react";
import { logger } from "@/lib/logger";
import type { Question, Exam } from "@/types/exam";
import type { Course } from "@/types/course";
import type { LiveSession } from "@/types/live";

function emptyQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    type: "multiple_choice",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "0",
    points: 1,
  };
}

const inputCls = "w-full border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-gray-200 focus:border-green/40 focus:outline-none transition-colors";
const labelCls = "font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1.5 block";

export default function NewExamPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [lives, setLives] = useState<LiveSession[]>([]);

  // Tipo de conteúdo ao qual o exame pertence
  const [contentType, setContentType] = useState<"course" | "live">("course");
  const [courseId, setCourseId] = useState("");
  const [liveId, setLiveId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(60);
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(2);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Carregar cursos e lives do professor
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getDocs(query(collection(db, "courses"), where("createdBy", "==", user.uid))),
      getDocs(query(collection(db, "lives"),   where("createdBy", "==", user.uid))),
    ]).then(([cSnap, lSnap]) => {
      if (!cancelled) {
        setCourses(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
        setLives(lSnap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSession)));
      }
    }).catch(err => logger.error("NewExam: failed to load content", err));
    return () => { cancelled = true; };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const addQuestion = () => setQuestions(prev => [...prev, emptyQuestion()]);

  const removeQuestion = (i: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, field: keyof Question, value: unknown) => {
    setQuestions(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value } as Question;
      return next;
    });
  };

  const changeQuestionType = (i: number, type: Question["type"]) => {
    const opts = type === "true_false" ? ["Verdadeiro", "Falso"]
                : type === "multiple_choice" ? ["", "", "", ""]
                : [];
    setQuestions(prev => {
      const next = [...prev];
      next[i] = { ...next[i], type, options: opts, correctAnswer: "0" } as Question;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError("");

    if (!title.trim()) { setError("O título é obrigatório."); return; }
    if (contentType === "course" && !courseId) { setError("Seleciona um curso."); return; }
    if (contentType === "live"   && !liveId)   { setError("Seleciona uma aula ao vivo."); return; }
    if (passingScore < 0 || passingScore > 100) { setError("A nota mínima deve estar entre 0 e 100."); return; }
    if (maxAttempts < 1) { setError("O número de tentativas deve ser no mínimo 1."); return; }
    if (questions.some(q => !q.question.trim())) { setError("Todas as perguntas precisam de ter texto."); return; }
    if (questions.some(q => q.type === "multiple_choice" && q.options?.some(o => !o.trim()))) {
      setError("Todas as opções das perguntas de múltipla escolha devem ser preenchidas.");
      return;
    }

    // Metadados do conteúdo seleccionado (para verificação de acesso no lado do aluno)
    const selectedCourse = contentType === "course" ? courses.find(c => c.id === courseId) : null;
    const selectedLive   = contentType === "live"   ? lives.find(l => l.id === liveId)     : null;

    setSubmitting(true);
    try {
      const examData: Omit<Exam, "id"> & { createdAt: unknown; updatedAt: unknown } = {
        // Conteúdo associado
        courseId:    contentType === "course" ? courseId : (selectedLive?.id ?? ""),
        courseTitle: contentType === "course" ? (selectedCourse?.title ?? "") : (selectedLive?.title ?? ""),
        courseType:  selectedCourse?.type,
        coursePrice: selectedCourse?.price,
        liveId:      contentType === "live" ? liveId : undefined,
        liveTitle:   selectedLive?.title,
        // Configuração do exame
        title: title.trim(),
        description: description.trim(),
        questions,
        passingScore,
        timeLimit: timeLimit > 0 ? timeLimit : null,
        maxAttempts,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, "exams"), examData);
      router.push("/dashboard/teacher/exams");
    } catch (err) {
      logger.error("NewExam: failed to create", err);
      setError("Erro ao criar avaliação. Tenta novamente.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[56rem] mx-auto space-y-6 animate-in fade-in duration-300">

      {/* Cabeçalho */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/teacher/exams")}
          className="flex items-center gap-1 font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors mb-4"
        >
          <ChevronLeft className="h-3 w-3" /> Avaliações
        </button>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-green/60 mb-2">
          // nova avaliação
        </p>
        <h1 className="text-2xl font-bold text-gray-100">Criar avaliação</h1>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-2.5 border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400/70" strokeWidth={1.5} />
          <p className="text-sm text-red-400/80">{error}</p>
        </div>
      )}

      {/* ── SECÇÃO 1: Informação básica ── */}
      <div className="border border-gray-800 bg-gray-900 p-5 space-y-4">
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">// configuração</p>

        <div className="space-y-1.5">
          <label className={labelCls}>Título</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Teste de Matemática Financeira"
            className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Descrição <span className="text-gray-800 normal-case">(opcional)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="Ex: Avaliação sobre juros compostos e amortização"
            className={`${inputCls} resize-none`} />
        </div>

        {/* Tipo de conteúdo — Curso ou Live */}
        <div className="space-y-1.5">
          <label className={labelCls}>Associar a</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setContentType("course"); setLiveId(""); }}
              className={`flex flex-1 items-center justify-center gap-2 border py-2.5 text-sm font-medium transition-all ${
                contentType === "course"
                  ? "border-green/30 bg-green/8 text-green/80"
                  : "border-gray-800 text-gray-600 hover:border-gray-700"
              }`}
            >
              <BookOpen className="h-4 w-4" strokeWidth={1.5} /> Curso
            </button>
            <button
              type="button"
              onClick={() => { setContentType("live"); setCourseId(""); }}
              className={`flex flex-1 items-center justify-center gap-2 border py-2.5 text-sm font-medium transition-all ${
                contentType === "live"
                  ? "border-red-500/30 bg-red-500/8 text-red-400/80"
                  : "border-gray-800 text-gray-600 hover:border-gray-700"
              }`}
            >
              <Radio className="h-4 w-4" strokeWidth={1.5} /> Aula ao vivo
            </button>
          </div>
        </div>

        {/* Selector do conteúdo */}
        {contentType === "course" ? (
          <div className="space-y-1.5">
            <label className={labelCls}>
              Curso
              <span className="text-gray-800 normal-case ml-1">
                — só alunos com acesso ao curso poderão fazer a avaliação
              </span>
            </label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)}
              className={`${inputCls} appearance-none`}>
              <option value="" className="bg-gray-900">Selecionar curso...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id} className="bg-gray-900">
                  {c.title} {c.price > 0 ? `· ${c.price.toLocaleString("pt-AO")} Kz` : "· Grátis"}
                </option>
              ))}
            </select>
            {courses.length === 0 && (
              <p className="font-mono text-[13px] text-amber-400/60">
                Nenhum curso encontrado. Cria um curso primeiro.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className={labelCls}>
              Aula ao vivo
              <span className="text-gray-800 normal-case ml-1">
                — só alunos com acesso à live poderão fazer a avaliação
              </span>
            </label>
            <select value={liveId} onChange={e => setLiveId(e.target.value)}
              className={`${inputCls} appearance-none`}>
              <option value="" className="bg-gray-900">Selecionar aula ao vivo...</option>
              {lives.map(l => (
                <option key={l.id} value={l.id} className="bg-gray-900">
                  {l.title} {l.target === "free" ? "· Grátis" : l.price ? `· ${l.price.toLocaleString("pt-AO")} Kz` : ""}
                </option>
              ))}
            </select>
            {lives.length === 0 && (
              <p className="font-mono text-[13px] text-amber-400/60">
                Nenhuma live encontrada. Cria uma aula ao vivo primeiro.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className={labelCls}>Nota mínima (%)</label>
            <input type="number" value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
              min={0} max={100} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Tempo limite (min) <span className="text-gray-800 normal-case">0 = sem limite</span></label>
            <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))}
              min={0} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Máx. tentativas</label>
            <input type="number" value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
              min={1} className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── SECÇÃO 2: Perguntas ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
            // perguntas · {questions.length}
          </p>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-1.5 border border-green/25 bg-green/8 px-3 py-1.5 font-mono text-[13px] uppercase tracking-widest text-green/70 hover:bg-green/15 transition-all"
          >
            <Plus className="h-3 w-3" /> Adicionar pergunta
          </button>
        </div>

        {questions.map((q, i) => (
          <div key={q.id} className="border border-gray-800 bg-gray-900">
            {/* Header da pergunta */}
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2.5">
              <span className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
                {String(i + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={q.type}
                  onChange={e => changeQuestionType(i, e.target.value as Question["type"])}
                  className="border border-gray-800 bg-gray-900 px-2 py-1 font-mono text-[13px] uppercase tracking-widest text-gray-500 focus:outline-none appearance-none"
                >
                  <option value="multiple_choice" className="bg-gray-900">Múltipla escolha</option>
                  <option value="true_false"      className="bg-gray-900">Verdadeiro / Falso</option>
                  <option value="short_answer"    className="bg-gray-900">Resposta curta</option>
                </select>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    className="flex items-center justify-center h-7 w-7 border border-red-500/20 bg-red-500/8 text-red-400/70 hover:bg-red-500/15 transition-all"
                    aria-label="Remover pergunta"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Enunciado */}
              <input
                type="text"
                value={q.question}
                onChange={e => updateQuestion(i, "question", e.target.value)}
                placeholder="Escreve a pergunta..."
                className={inputCls}
              />

              {/* Múltipla escolha */}
              {q.type === "multiple_choice" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correctAnswer === String(oi)}
                        onChange={() => updateQuestion(i, "correctAnswer", String(oi))}
                        className="shrink-0"
                        style={{ accentColor: "var(--green)" }}
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...(q.options ?? [])];
                          newOpts[oi] = e.target.value;
                          updateQuestion(i, "options", newOpts);
                        }}
                        placeholder={`Opção ${String.fromCharCode(65 + oi)}`}
                        className={`${inputCls} flex-1`}
                      />
                    </div>
                  ))}
                  <p className="font-mono text-[13px] text-gray-700">Selecciona o círculo da opção correcta.</p>
                </div>
              )}

              {/* Verdadeiro / Falso */}
              {q.type === "true_false" && (
                <div className="flex gap-3">
                  {["Verdadeiro", "Falso"].map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex flex-1 items-center justify-center gap-2 border py-2.5 cursor-pointer text-sm transition-all ${
                        q.correctAnswer === String(oi)
                          ? "border-green/30 bg-green/8 text-green/80"
                          : "border-gray-800 text-gray-600 hover:border-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`tf-${q.id}`}
                        checked={q.correctAnswer === String(oi)}
                        onChange={() => updateQuestion(i, "correctAnswer", String(oi))}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {/* Resposta curta */}
              {q.type === "short_answer" && (
                <div className="space-y-1.5">
                  <label className={labelCls}>Resposta correcta</label>
                  <input
                    type="text"
                    value={q.correctAnswer}
                    onChange={e => updateQuestion(i, "correctAnswer", e.target.value)}
                    placeholder="Ex: 15% ou Portugal"
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Criar */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-green py-3 text-sm font-bold text-gray-950 hover:bg-green-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {submitting
          ? <><Loader2 className="h-4 w-4 animate-spin" /> A criar...</>
          : "Criar avaliação"
        }
      </button>
    </div>
  );
}
