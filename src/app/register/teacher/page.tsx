"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { User, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, Sun, Moon, BookOpen, Users, Zap, ArrowRight, MessageSquare } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";

const HERO_CARDS = [
  { icon: BookOpen, title: "Crie Cursos", desc: "Publique conteúdo estruturado e engajante" },
  { icon: Users, title: "Dê Aulas ao Vivo", desc: "Interaja com alunos em tempo real" },
  { icon: Zap, title: "Ganhe Renda", desc: "Monetize seu conhecimento e expertise" },
];

export default function TeacherRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("public-theme") as "dark" | "light" | null;
    if (saved && saved !== theme) setTheme(saved);
    setMounted(true);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("O nome é obrigatório."); return; }
    if (/\d/.test(name)) { setError("O nome não pode conter números."); return; }
    if (password !== confirmPassword) { setError("As palavras-passe não coincidem."); return; }
    if (!specialty.trim()) { setError("A especialidade é obrigatória."); return; }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(userCredential.user, { displayName: name });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        name,
        role: "teacher",
        status: "pending",
        specialty,
        bio: bio || "",
        createdAt: new Date(),
      });
      await sendEmailVerification(userCredential.user);
      router.push("/verify-email");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      const messages: Record<string, string> = {
        "auth/email-already-in-use": "Este email já está registado. Tente fazer login.",
        "auth/weak-password": "A palavra-passe deve ter pelo menos 6 caracteres.",
        "auth/invalid-email": "O formato do email é inválido.",
        "auth/too-many-requests": "Muitas tentativas. Espere alguns minutos e tente novamente.",
      };
      setError(messages[code] || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const togglePublicTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("public-theme", next);
      return next;
    });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden" data-theme={theme}>
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Aurora Gradients - Green theme for teachers */}
        <div className="absolute top-0 right-1/4 w-96 h-96 md:w-[900px] md:h-[900px] bg-gradient-to-br from-green-500/20 to-emerald-500/10 blur-3xl md:blur-[500px] rounded-full" />
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 md:w-[700px] md:h-[700px] bg-gradient-to-tr from-emerald-500/10 to-green-500/5 blur-3xl md:blur-[500px] rounded-full" />
        
        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.5" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Network Nodes */}
        <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-green-400/20" />
        <div className="absolute top-32 right-32 w-1 h-1 rounded-full bg-emerald-400/30" />
        <div className="absolute bottom-40 left-20 w-2 h-2 rounded-full bg-emerald-400/15" />
      </div>

      {/* Header */}
      <header className="relative z-40 px-6 md:px-20 py-6 md:py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-75 transition-opacity">
          <img src="/Logo-Academy-White.svg" alt="Academy" className="h-10 md:h-12 w-auto" />
          <span className="text-xl md:text-2xl font-bold text-white">Netsulwel</span>
        </Link>
        <button
          onClick={togglePublicTheme}
          className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-700/50 bg-white/5 hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
        >
          {!mounted || theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      {/* Main Content */}
      <div className="relative z-20 flex items-center justify-center min-h-[calc(100vh-120px)] px-4 md:px-6 py-8 md:py-12">
        <div className="w-full max-w-7xl">
          {/* Desktop: 45/55 split | Mobile: stacked */}
          <div className="flex flex-col lg:flex-row lg:gap-16 lg:items-center">
            
            {/* LEFT: Register Form (45% on desktop) */}
            <div className="w-full lg:w-5/12 flex justify-center lg:justify-end mb-12 lg:mb-0">
              <div className="w-full max-w-md">
                
                {/* Form Title */}
                <div className="mb-12">
                  <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold leading-tight text-white mb-4">
                    Torne-se professor
                  </h1>
                  <p className="text-base md:text-lg text-gray-400 leading-relaxed opacity-75">
                    Compartilhe seu conhecimento e ganhe com educação.
                  </p>
                </div>

                {/* Register Card with Glassmorphism */}
                <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
                  
                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3 text-sm text-red-300 animate-in fade-in">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-6">
                    {/* Name Input */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Nome completo</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="João Silva"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all outline-none disabled:opacity-50"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="email"
                          placeholder="professor@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all outline-none disabled:opacity-50"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Palavra-passe</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-14 pl-12 pr-12 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all outline-none disabled:opacity-50"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Confirmar palavra-passe</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full h-14 pl-12 pr-12 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all outline-none disabled:opacity-50"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={loading}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Specialty Input */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Especialidade</label>
                      <div className="relative">
                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Ex: Programação Web, Finanças"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all outline-none disabled:opacity-50"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Bio Textarea */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Biografia (opcional)</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
                        <textarea
                          rows={3}
                          placeholder="Conte sobre sua experiência e formação..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full px-4 pl-12 py-3 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all outline-none disabled:opacity-50 resize-none"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-300">
                      Sua conta ficará em <strong>avaliação</strong> até ser aprovada pela administração.
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 font-semibold text-white text-base flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Criando conta...</span>
                        </>
                      ) : (
                        <>
                          <span>Registar como Professor</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Footer Links */}
                    <div className="border-t border-gray-700/30 pt-6 mt-6 space-y-3">
                      <p className="text-center text-sm text-gray-400">
                        Já tem conta?{" "}
                        <Link href="/login" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                          Entrar agora
                        </Link>
                      </p>
                      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                        <Link href="/register" className="hover:text-gray-400 transition-colors">
                          Sou aluno
                        </Link>
                        <span>•</span>
                        <Link href="/register/institution" className="hover:text-gray-400 transition-colors">
                          Sou instituição
                        </Link>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* RIGHT: Hero Section (55% on desktop) */}
            <div className="w-full lg:w-7/12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-white mb-6">
                    Ensine e ganhe.
                  </h2>
                  <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-2xl opacity-85">
                    Alcance milhares de alunos, crie conteúdo único e desenvolva sua carreira como educador digital.
                  </p>
                </div>

                {/* Hero Cards */}
                <div className="space-y-4 mt-12">
                  {HERO_CARDS.map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={i}
                        className="group p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-md hover:from-white/15 hover:to-white/10 hover:border-white/25 transition-all duration-300 cursor-pointer flex gap-5"
                      >
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500/40 to-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:from-green-500/60 group-hover:to-emerald-500/40 transition-all">
                          <Icon className="w-6 h-6 text-green-200" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white mb-1 group-hover:text-green-200 transition-colors">
                            {card.title}
                          </p>
                          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                            {card.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
