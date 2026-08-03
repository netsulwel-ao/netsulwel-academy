"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { Building2, Mail, Phone, MapPin, User, Lock, Loader2, Eye, EyeOff, AlertCircle, Sun, Moon, Users, BookOpen, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

const HERO_CARDS = [
  { icon: Users, title: "Gerencie Alunos", desc: "Acompanhe progresso em tempo real" },
  { icon: BookOpen, title: "Ofereça Cursos", desc: "Plataforma completa de educação" },
  { icon: Globe, title: "Alcance Global", desc: "Expanda sua instituição digitalmente" },
];

export default function InstitutionRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Step 1 — admin account
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 — institution details
  const [instName, setInstName] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instPhone, setInstPhone] = useState("");
  const [instAddress, setInstAddress] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("public-theme") as "dark" | "light" | null;
    if (saved && saved !== theme) setTheme(saved);
    setMounted(true);
  }, []);

  const togglePublicTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("public-theme", next);
      return next;
    });
  }, []);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!adminName.trim()) { setError("O nome do administrador é obrigatório."); return; }
    if (/\d/.test(adminName)) { setError("O nome não pode conter números."); return; }
    if (!adminEmail.trim()) { setError("O email é obrigatório."); return; }
    if (adminPassword.length < 6) { setError("A palavra-passe deve ter pelo menos 6 caracteres."); return; }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!instName.trim() || !instEmail.trim()) {
      setError("Nome e email da instituição são obrigatórios.");
      return;
    }
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      if (adminName) await updateProfile(userCredential.user, { displayName: adminName });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: adminEmail,
        name: adminName,
        role: "institution",
        createdAt: new Date(),
      });

      const token = await userCredential.user.getIdToken();

      const res = await fetch("/api/institutions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: instName,
          email: instEmail,
          phone: instPhone || null,
          address: instAddress || null,
          adminId: userCredential.user.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registar instituição.");

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
      setError(messages[code] || (err instanceof Error ? err.message : "Erro ao criar conta."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden" data-theme={theme}>
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Aurora Gradients - Cyan theme for institutions */}
        <div className="absolute top-0 right-1/4 w-96 h-96 md:w-[900px] md:h-[900px] bg-gradient-to-br from-cyan-500/20 to-blue-500/10 blur-3xl md:blur-[500px] rounded-full" />
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 md:w-[700px] md:h-[700px] bg-gradient-to-tr from-blue-500/10 to-cyan-500/5 blur-3xl md:blur-[500px] rounded-full" />
        
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
        <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-cyan-400/20" />
        <div className="absolute top-32 right-32 w-1 h-1 rounded-full bg-blue-400/30" />
        <div className="absolute bottom-40 left-20 w-2 h-2 rounded-full bg-blue-400/15" />
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
                    Registe a sua instituição
                  </h1>
                  <p className="text-base md:text-lg text-gray-400 leading-relaxed opacity-75">
                    Gerencie educação em larga escala com nossa plataforma.
                  </p>
                </div>

                {/* Register Card with Glassmorphism */}
                <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
                  
                  {/* Progress Indicator */}
                  <div className="flex gap-2 mb-8">
                    <div className={`h-2 w-8 rounded-full transition-all ${step === 1 ? "bg-cyan-400" : "bg-cyan-400"}`} />
                    <div className={`h-2 w-8 rounded-full transition-all ${step === 2 ? "bg-cyan-400" : "bg-gray-600"}`} />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3 text-sm text-red-300 animate-in fade-in">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  {step === 1 ? (
                    <form onSubmit={handleStep1} className="space-y-6">
                      <h2 className="text-2xl font-bold text-white mb-6">Conta do Administrador</h2>

                      {/* Admin Name Input */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Nome do administrador</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                          <input
                            type="text"
                            placeholder="João Silva"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none disabled:opacity-50"
                            required
                          />
                        </div>
                      </div>

                      {/* Admin Email Input */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                          <input
                            type="email"
                            placeholder="admin@instituicao.com"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none disabled:opacity-50"
                            required
                          />
                        </div>
                      </div>

                      {/* Admin Password Input */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Palavra-passe</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full h-14 pl-12 pr-12 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none disabled:opacity-50"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 font-semibold text-white text-base flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-95 transition-all mt-8"
                      >
                        <span>Continuar</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <h2 className="text-2xl font-bold text-white mb-6">Dados da Instituição</h2>

                      {/* Institution Name Input */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Nome da Instituição</label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Escola Secundária de Luanda"
                            value={instName}
                            onChange={(e) => setInstName(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none disabled:opacity-50"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Institution Email Input */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Email da Instituição</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                          <input
                            type="email"
                            placeholder="contacto@escola.pt"
                            value={instEmail}
                            onChange={(e) => setInstEmail(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none disabled:opacity-50"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Institution Phone Input */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Telefone</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                          <input
                            type="tel"
                            placeholder="+244 923 000 000"
                            value={instPhone}
                            onChange={(e) => setInstPhone(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none disabled:opacity-50"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Institution Address Input */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Morada</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Rua da Escola, 123, Luanda"
                            value={instAddress}
                            onChange={(e) => setInstAddress(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-600/50 bg-white/5 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none disabled:opacity-50"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Info Box */}
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-300">
                        Após o registo, sua instituição ficará em <strong>avaliação</strong> até ser aprovada.
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setStep(1); setError(""); }}
                          disabled={loading}
                          className="flex-1 h-12 rounded-2xl border border-gray-600/50 bg-white/5 hover:bg-white/10 transition-colors text-white font-semibold disabled:opacity-50"
                        >
                          Voltar
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 font-semibold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Registando...</span>
                            </>
                          ) : (
                            <>
                              <span>Registar Instituição</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Footer Links */}
                      <div className="border-t border-gray-700/30 pt-6 mt-6 text-center text-sm text-gray-400">
                        Já tem conta?{" "}
                        <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                          Entrar agora
                        </Link>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Hero Section (55% on desktop) */}
            <div className="w-full lg:w-7/12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-white mb-6">
                    Educação digital em escala.
                  </h2>
                  <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-2xl opacity-85">
                    Transforme sua instituição com uma plataforma completa de educação, da gestão ao aprendizado.
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
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500/40 to-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:from-cyan-500/60 group-hover:to-blue-500/40 transition-all">
                          <Icon className="w-6 h-6 text-cyan-200" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white mb-1 group-hover:text-cyan-200 transition-colors">
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
