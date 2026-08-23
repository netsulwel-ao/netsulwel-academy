"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, getDoc,
  doc, updateDoc,
} from "firebase/firestore";
import {
  MessageSquare, Users, Plus, Loader2,
  BookOpen, AlertTriangle, ChevronRight, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { getOrCreateGroupChat, groupChatId } from "@/lib/chat";
import type { Course } from "@/types/course";
import type { CourseChat } from "@/types/chat";

export default function TeacherChatsPage() {
  const { user, isTeacher } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [chats, setChats] = useState<CourseChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [syncingFor, setSyncingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isTeacher) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      // ── 1. Cursos do professor ──────────────────────────────────
      // Feito em try separado — se falhar, mostramos erro mas continuamos
      let loadedCourses: Course[] = [];
      try {
        const coursesSnap = await getDocs(
          query(collection(db, "courses"), where("createdBy", "==", user.uid))
        );
        loadedCourses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
        if (!cancelled) setCourses(loadedCourses);
      } catch (err) {
        const code = (err as { code?: string })?.code ?? "";
        const msg  = (err as { message?: string })?.message ?? String(err);
        logger.error("TeacherChats: courses query failed", err, { code, msg });
        if (!cancelled) setError(`Erro ao carregar cursos (${code || msg}). Verifica as regras do Firestore.`);
        if (!cancelled) setLoading(false);
        return; // sem cursos, não há nada mais a fazer
      }

      // ── 2. Chat de grupo para cada curso (getDoc individual) ────
      // Promise.allSettled — não falha se um chat não existir ou der permission denied
      const chatResults = await Promise.allSettled(
        loadedCourses
          .filter(c => !!c.id)
          .map(c => getDoc(doc(db, "courseChats", `course_${c.id}`)))
      );

      const groupChats: CourseChat[] = [];
      for (const result of chatResults) {
        if (result.status === "fulfilled" && result.value.exists()) {
          groupChats.push({ id: result.value.id, ...result.value.data() } as CourseChat);
        }
      }

      // ── 3. Chats individuais (professor é participante) ─────────
      let individualChats: CourseChat[] = [];
      try {
        const indivSnap = await getDocs(
          query(
            collection(db, "courseChats"),
            where("participants", "array-contains", user.uid),
          )
        );
        individualChats = indivSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as CourseChat))
          .filter(c => c.type === "individual");
      } catch {
        // Sem chats individuais ou índice não existe — não crítico
      }

      if (!cancelled) {
        setChats([...groupChats, ...individualChats]);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.uid, isTeacher]); // eslint-disable-line react-hooks/exhaustive-deps

  // Verificar quais cursos já têm chat de grupo
  const coursesWithChat = new Set(chats.filter(c => c.type === "group").map(c => c.courseId));

  const handleCreateGroupChat = async (course: Course) => {
    if (!user || !course.id) return;
    setCreatingFor(course.id);
    try {
      // STEP 1: query users
      console.log("[DEBUG] step 1 — query users, courseId:", course.id, "uid:", user.uid);
      let usersSnap;
      try {
        usersSnap = await getDocs(
          query(collection(db, "users"), where("enrolledCourses", "array-contains", course.id))
        );
        console.log("[DEBUG] step 1 OK — users found:", usersSnap.size);
      } catch (e: any) {
        console.error("[DEBUG] step 1 FAILED — query users:", e?.code, e?.message);
        throw e;
      }

      const participants = [user.uid];
      const participantNames: Record<string, string> = {
        [user.uid]: user.displayName ?? "Professor",
      };
      const participantPhotos: Record<string, string> = {};
      if (user.photoURL) participantPhotos[user.uid] = user.photoURL;

      usersSnap.docs.forEach(d => {
        participants.push(d.id);
        participantNames[d.id] = d.data().name ?? d.data().displayName ?? "Aluno";
        if (d.data().photoURL) participantPhotos[d.id] = d.data().photoURL;
      });

      // STEP 2: getOrCreateGroupChat (getDoc + setDoc)
      console.log("[DEBUG] step 2 — getOrCreateGroupChat, participants:", participants);
      const chatId = await getOrCreateGroupChat(
        course.id,
        course.title,
        participants,
        participantNames,
        participantPhotos,
      );
      console.log("[DEBUG] step 2 OK — chatId:", chatId);

      toast.success(`Chat de grupo criado para "${course.title}"`);
      router.push(`/dashboard/chats/${chatId}`);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      const msg  = (err as { message?: string })?.message ?? String(err);
      logger.error("TeacherChats: failed to create group chat", err, { courseId: course.id, code, msg });
      console.error("[DEBUG] final catch — code:", code, "message:", msg, "raw:", err);
      if (code === "permission-denied") {
        toast.error("Sem permissão para criar o chat. Verifica as regras do Firestore.");
      } else {
        toast.error(`Erro ao criar chat (${code || msg}). Tenta novamente.`);
      }
    } finally {
      setCreatingFor(null);
    }
  };

  // Sincronizar todos os alunos inscritos num chat de grupo existente
  const handleSyncParticipants = useCallback(async (course: Course) => {
    if (!user || !course.id) return;
    setSyncingFor(course.id);
    try {
      const chatId = groupChatId(course.id);
      const chatRef = doc(db, "courseChats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        toast.error("Chat não encontrado.");
        return;
      }

      // Buscar todos os alunos inscritos
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("enrolledCourses", "array-contains", course.id))
      );

      let added = 0;
      const existingParticipants: string[] = chatSnap.data().participants ?? [];
      const updates: Record<string, unknown> = {};

      usersSnap.docs.forEach(d => {
        if (!existingParticipants.includes(d.id)) {
          // Não podemos usar arrayUnion múltiplas vezes no mesmo campo numa só chamada
          // então vamos construir a lista manualmente
          added++;
        }
        const name = d.data().name ?? d.data().displayName ?? "Aluno";
        updates[`participantNames.${d.id}`] = name;
        if (d.data().photoURL) {
          updates[`participantPhotos.${d.id}`] = d.data().photoURL;
        }
      });

      // Criar lista final de participantes (professor + todos os alunos)
      const allStudentIds = usersSnap.docs.map(d => d.id);
      const allParticipants = [...new Set([user.uid, ...existingParticipants, ...allStudentIds])];
      updates.participants = allParticipants;
      updates[`participantNames.${user.uid}`] = user.displayName ?? "Professor";
      if (user.photoURL) updates[`participantPhotos.${user.uid}`] = user.photoURL;

      await updateDoc(chatRef, updates);

      toast.success(
        added > 0
          ? `${added} novo${added !== 1 ? "s" : ""} aluno${added !== 1 ? "s" : ""} adicionado${added !== 1 ? "s" : ""} ao chat`
          : "Participantes já estão actualizados"
      );
    } catch (err) {
      logger.error("TeacherChats: failed to sync participants", err, { courseId: course.id });
      toast.error("Erro ao sincronizar participantes.");
    } finally {
      setSyncingFor(null);
    }
  }, [user]);

  if (!isTeacher) return null;
  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple mb-2">
            // chats do professor
          </p>
          <h1 className="text-2xl font-bold text-gray-100">Chats</h1>
          <p className="mt-1 text-sm text-gray-600">
            Cria chats de grupo para os teus cursos. Só os alunos inscritos têm acesso.
          </p>
        </div>
        <Link
          href="/dashboard/chats"
          className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:border-gray-700 hover:text-gray-400 transition-all shrink-0"
        >
          Ver todas as mensagens <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={1.5} />
          <p className="text-sm text-amber-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {/* Sem cursos */}
      {!loading && courses.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <BookOpen className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
            // sem cursos
          </p>
          <p className="text-sm text-gray-600 mb-5">Cria um curso primeiro para depois criar um chat de grupo.</p>
          <Link
            href="/dashboard/teacher/courses/new"
            className="flex items-center gap-1.5 bg-green-600 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-green-700 transition-all"
          >
            <Plus className="h-3 w-3" /> Criar curso
          </Link>
        </div>
      )}

      {/* Lista de cursos com acção de chat */}
      {!loading && courses.length > 0 && (
        <div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-3">
            // cursos · {courses.length}
          </p>
          <div className="border border-gray-800 divide-y divide-gray-800">
            {courses.map(course => {
              const hasChat = coursesWithChat.has(course.id!);
              const existingChat = chats.find(c => c.type === "group" && c.courseId === course.id);
              const isCreating = creatingFor === course.id;

              return (
                <div key={course.id} className="flex flex-col gap-4 px-5 py-4 hover:bg-gray-900 transition-colors">
                  {/* Thumbnail + info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-12 w-16 shrink-0 overflow-hidden border border-gray-800 bg-gray-900">
                      {course.thumbnail
                        ? <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center"><BookOpen className="h-4 w-4 text-gray-800" strokeWidth={1} /></div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-200 truncate">{course.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 font-mono text-[13px] text-gray-700">
                        <span>{course.lessonsCount ?? 0} aulas</span>
                        <span>·</span>
                        <span className={`${course.status === "published" ? "text-green" : "text-gray-700"}`}>
                          {course.status === "published" ? "publicado" : "rascunho"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acção */}
                  <div className="shrink-0 flex flex-wrap items-center gap-2">
                    {hasChat && existingChat ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSyncParticipants(course)}
                          disabled={syncingFor === course.id}
                          title="Sincronizar alunos inscritos no chat"
                          className="flex items-center gap-1.5 border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:border-gray-600 hover:text-gray-400 disabled:opacity-50 transition-all"
                        >
                          {syncingFor === course.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                          }
                          {syncingFor === course.id ? "A sincronizar..." : "Sync alunos"}
                        </button>
                        <Link
                          href={`/dashboard/chats/${existingChat.id}`}
                          className="flex items-center gap-1.5 bg-purple px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-purple-600 transition-all"
                        >
                          <MessageSquare className="h-3 w-3" strokeWidth={1.5} /> Abrir chat
                        </Link>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCreateGroupChat(course)}
                        disabled={isCreating}
                        className="flex items-center gap-1.5 bg-green-600 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-green-700 disabled:opacity-50 transition-all"
                      >
                        {isCreating
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Plus className="h-3 w-3" strokeWidth={1.5} />
                        }
                        {isCreating ? "A criar..." : "Criar chat"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nota explicativa */}
          <div className="mt-4 flex items-start gap-2.5 border border-gray-800 bg-gray-900 px-4 py-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-gray-700" strokeWidth={1.5} />
            <p className="text-sm text-gray-600 leading-relaxed">
              Ao criar um chat de grupo, todos os alunos actualmente inscritos no curso são adicionados automaticamente.
              Novos alunos que se inscrevam após a criação do chat são adicionados automaticamente no momento da compra.
              Usa <strong className="text-gray-500 font-mono text-[13px]">Sync alunos</strong> para forçar uma sincronização manual.
            </p>
          </div>
        </div>
      )}

      {/* Chats individuais existentes */}
      {!loading && chats.filter(c => c.type === "individual").length > 0 && (
        <div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-3">
            // chats individuais · {chats.filter(c => c.type === "individual").length}
          </p>
          <div className="border border-gray-800 divide-y divide-gray-800">
            {chats
              .filter(c => c.type === "individual")
              .map(chat => {
                const otherId = Object.keys(chat.participantNames).find(id => id !== user?.uid) ?? "";
                const otherName = chat.participantNames[otherId] ?? "Aluno";
                return (
                  <Link
                    key={chat.id}
                    href={`/dashboard/chats/${chat.id}`}
                    className="group flex items-center gap-3 px-5 py-4 hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-200 group-hover:text-white truncate transition-colors">
                        {otherName}
                      </p>
                      <p className="font-mono text-[13px] text-gray-700 mt-0.5">{chat.courseTitle}</p>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-600 mt-0.5 truncate">{chat.lastMessage}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-gray-500 transition-colors shrink-0" />
                  </Link>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
