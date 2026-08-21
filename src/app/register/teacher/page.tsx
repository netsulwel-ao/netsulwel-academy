"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User, Mail, Lock, Loader2, AlertCircle,
  Eye, EyeOff, ArrowRight, ArrowLeft,
  BookOpen, Users, Zap, MessageSquare,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";


const PERKS = [
  { icon: BookOpen, label: "Crie cursos completos", sub: "Conteúdo estruturado, vídeos e materiais" },
  { icon: Users,    label: "Dê aulas ao vivo",      sub: "Interaja com alunos em tempo real" },
  { icon: Zap,      label: "Monetize o seu conhecimento", sub: "Ganhe com cada aluno que inscrever" },
];

export default function TeacherRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("O nome é obrigatório."); return; }
    if (/\d/.test(name)) { setError("O nome não pode conter números."); return; }
    if (!email.trim()) { setError("O email é obrigatório."); return; }
    if (!specialty.trim()) { setError("A especialidade é obrigatória."); return; }
    if (password.length < 6) { setError("A palavra-passe deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        name,
        role: "teacher",
        plan: "free",
        status: "pending",
        specialty,
        bio: bio.trim() || "",
        createdAt: new Date(),
      });
      await sendEmailVerification(cred.user);
      router.push("/verify-email");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const messages: Record<string, string> = {
        "auth/email-already-in-use": "Este email já está registado. Tente fazer login.",
        "auth/weak-password": "A palavra-passe deve ter pelo menos 6 caracteres.",
        "auth/invalid-email": "Formato de email inválido.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
      };
      setError(messages[code] ?? "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-950">
      {/* Form */}
      <div className="relative flex flex-1 flex-col overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.06]" />
        <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] bg-green/6 blur-[120px]" />

        {/* Header */}
        <header className="flex items-center justify-between px-8 pt-8 pb-4 relative z-10">
          <Link href="/" className="flex items-center gap-2.5 lg:invisible">
            <img src="/Logo-Academy-White.svg" alt="Academy" className="h-9 w-auto brightness-0 invert" />
            <span className="text-base font-bold text-white">Netsulwel</span>
          </Link>
          <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Já tenho conta <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        {/* Conteúdo */}
        <div className="flex flex-1 flex-col justify-center px-8 py-8 relative z-10">
          <div className="mx-auto w-full max-w-[400px]">

            {/* Eyebrow */}
            <div className="mb-6">
              <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-green/70 mb-2">
                // registo de professor
              </p>
              <h1 className="text-2xl font-bold text-gray-100">Torne-se professor</h1>
              <p className="mt-1 text-sm text-gray-500">
                Partilhe o seu conhecimento e monetize a expertise
              </p>
            </div>

            {/* Perks compactos */}
            <div className="mb-6 space-y-2">
              {PERKS.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-b-0">
                  <Icon className="h-3.5 w-3.5 text-green/60 shrink-0" strokeWidth={1.5} />
                  <div>
                    <span className="text-sm font-medium text-gray-300">{label}</span>
                    <span className="text-sm text-gray-600 ml-2">{sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input
                    id="name" type="text" required autoComplete="name"
                    disabled={loading} placeholder="João Silva"
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-700 focus:border-green/50 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input
                    id="email" type="email" required autoComplete="email"
                    disabled={loading} placeholder="professor@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-700 focus:border-green/50 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                  Palavra-passe
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input
                    id="password" type={showPassword ? "text" : "password"} required
                    autoComplete="new-password" disabled={loading} placeholder="min. 6 caracteres"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-10 text-sm text-gray-100 placeholder-gray-700 focus:border-green/50 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Especialidade */}
              <div className="space-y-1.5">
                <label htmlFor="specialty" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                  Especialidade
                </label>
                <div className="relative">
                  <BookOpen className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input
                    id="specialty" type="text" required disabled={loading}
                    placeholder="Ex: Programação Web, Finanças"
                    value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                    className="block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-700 focus:border-green/50 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                  />
                </div>
              </div>

              {/* Bio — opcional */}
              <div className="space-y-1.5">
                <label htmlFor="bio" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                  Biografia <span className="text-gray-700 normal-case tracking-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-600" />
                  <textarea
                    id="bio" rows={3} disabled={loading}
                    placeholder="Conte sobre a sua experiência e formação..."
                    value={bio} onChange={(e) => setBio(e.target.value)}
                    className="block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-700 focus:border-green/50 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Aviso de aprovação */}
              <div className="flex items-start gap-2.5 border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                <span className="text-amber-400/80 text-sm mt-0.5">⚠</span>
                <p className="text-sm text-amber-400/70 leading-relaxed">
                  A conta ficará em <strong className="text-amber-400/90">avaliação</strong> até ser aprovada pela administração.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 bg-green py-2.5 text-sm font-bold text-gray-950 hover:bg-green-light disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Registar como Professor <ArrowRight className="h-3.5 w-3.5" /></>
                )}
              </button>
            </form>

            {/* Rodapé */}
            <div className="mt-8 space-y-3 border-t border-gray-800 pt-6">
              <p className="text-center text-sm text-gray-600">
                Já tem conta?{" "}
                <Link href="/login" className="text-green/80 hover:text-green font-semibold transition-colors">
                  Entrar agora
                </Link>
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-700">
                <Link href="/register" className="hover:text-gray-500 transition-colors">Sou aluno</Link>
                <span>·</span>
                <Link href="/register/institution" className="hover:text-gray-500 transition-colors">Sou instituição</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
