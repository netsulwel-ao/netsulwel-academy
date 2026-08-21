"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Lock, Loader2, AlertCircle,
  Eye, EyeOff, ArrowRight, ArrowLeft,
  Phone, Globe, MapPin, Calendar, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  type AuthProvider,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { GoogleIcon, GithubIcon } from "@/components/ui/AuthIcons";

import { PageTransition } from "@/components/PageTransition";
import { TransitionLink } from "@/components/TransitionLink";

type Step = 1 | 2;

const EASE = [0.16, 1, 0.3, 1] as const;

export default function RegisterPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>(1);
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  // Step 1 — conta
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2 — perfil
  const [telefone, setTelefone] = useState("");
  const [idade, setIdade] = useState("");
  const [genero, setGenero] = useState("");
  const [pais, setPais] = useState("");
  const [nacionalidade, setNacionalidade] = useState("");
  const [morada, setMorada] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("redirect");
    if (r && r.startsWith("/") && !r.startsWith("//") && !r.includes("://")) setRedirectTo(r);
  }, []);

  // Validação step 1
  const validateStep1 = (): string | null => {
    if (!name.trim()) return "O nome é obrigatório.";
    if (/\d/.test(name)) return "O nome não pode conter números.";
    if (!email.trim()) return "O email é obrigatório.";
    if (password.length < 6) return "A palavra-passe deve ter pelo menos 6 caracteres.";
    if (password !== confirmPassword) return "As palavras-passe não coincidem.";
    return null;
  };

  // Validação step 2
  const validateStep2 = (): string | null => {
    if (!telefone.trim()) return "O telefone é obrigatório.";
    const idadeN = Number(idade);
    if (!idade || isNaN(idadeN) || idadeN < 12 || idadeN > 120) return "Indique uma idade válida (12–120).";
    if (!genero) return "Selecione o género.";
    if (!pais.trim()) return "O país é obrigatório.";
    if (!nacionalidade.trim()) return "A nacionalidade é obrigatória.";
    if (!morada.trim()) return "A morada é obrigatória.";
    return null;
  };

  const goToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const err = validateStep1();
    if (err) { setError(err); return; }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const err = validateStep2();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        name,
        role: "aluno",
        createdAt: new Date(),
        telefone,
        idade: Number(idade),
        genero,
        pais,
        nacionalidade,
        morada,
      });
      await sendEmailVerification(cred.user);
      router.push(`/verify-email${redirectTo !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const messages: Record<string, string> = {
        "auth/email-already-in-use": "Este email já está registado. Tente fazer login.",
        "auth/weak-password": "A palavra-passe deve ter pelo menos 6 caracteres.",
        "auth/invalid-email": "Formato de email inválido.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
      };
      setError(messages[code] ?? "Erro ao criar conta. Tente novamente.");
      // Se erro na criação da conta, voltar ao step 1 se for erro de email/password
      if (["auth/email-already-in-use", "auth/weak-password", "auth/invalid-email"].includes(code)) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: AuthProvider, name: string) => {
    // Social login não precisa de validação de formulário
    setError("");
    setSocialLoading(name);
    try {
      const cred = await signInWithPopup(auth, provider);
      const ref = doc(db, "users", cred.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        // Criar perfil mínimo — sem dados extras obrigatórios para social
        await setDoc(ref, {
          email: cred.user.email ?? "",
          name: cred.user.displayName ?? "",
          role: "aluno",
          createdAt: new Date(),
        });
      }
      router.push(redirectTo);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setError(code === "auth/popup-blocked"
        ? "Popup bloqueado. Permita popups e tente novamente."
        : `Falha ao registar com ${name}.`);
    } finally {
      setSocialLoading(null);
    }
  };

  const isAnyLoading = loading || !!socialLoading;

  const stepAnim = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18, filter: "blur(6px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -12, filter: "blur(6px)" },
      };

  const fieldAnim = reduceMotion
    ? {}
    : { initial: { opacity: 0, x: -14 }, animate: { opacity: 1, x: 0 } };

  return (
    <PageTransition type="auth">
    <main className="flex min-h-screen bg-gray-950">
      {/* Form */}
      <div className="relative flex flex-1 flex-col overflow-y-auto">
        {/* Fundo */}
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.06]" />
        <motion.div
          className="pointer-events-none absolute -top-20 -left-20 h-[500px] w-[500px] bg-purple/6 blur-[140px]"
          animate={reduceMotion ? {} : { opacity: [0.4, 0.8, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Header */}
        <motion.header
          className="flex items-center justify-between px-8 pt-8 pb-4 relative z-10"
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <TransitionLink href="/" className="flex items-center gap-2.5 lg:invisible">
            <img src="/Logo-Academy-White.svg" alt="Academy" className="h-9 w-auto brightness-0 invert" />
            <span className="text-base font-bold text-white">Netsulwel</span>
          </TransitionLink>
          <TransitionLink
            href="/login"
            className="group flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Já tenho conta
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </TransitionLink>
        </motion.header>

        {/* Conteúdo */}
        <div className="flex flex-1 flex-col justify-center px-8 py-8 relative z-10">
          <div className="mx-auto w-full max-w-[400px]">

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                {...stepAnim}
                transition={{ duration: 0.4, ease: EASE }}
              >
                {/* Progress steps */}
                <div className="mb-8 flex items-center gap-0">
                  {[1, 2].map((s) => (
                    <div key={s} className="flex items-center">
                      <motion.div
                        className={`flex h-6 w-6 items-center justify-center text-[13px] font-bold transition-colors ${
                          s <= step
                            ? "bg-purple text-white"
                            : "border border-gray-700 text-gray-600"
                        }`}
                        initial={false}
                        animate={{ scale: s === step ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        {s < step ? "✓" : s}
                      </motion.div>
                      {s < 2 && (
                        <motion.div
                          className={`h-px w-12 origin-left ${s < step ? "bg-purple/50" : "bg-gray-800"}`}
                          initial={false}
                          animate={{ scaleX: s < step ? 1 : 0.2 }}
                          transition={{ duration: 0.4 }}
                        />
                      )}
                    </div>
                  ))}
                  <span className="ml-4 text-sm text-gray-600 font-mono">
                    {step === 1 ? "conta" : "perfil"}
                  </span>
                </div>

                {/* Eyebrow */}
                <div className="mb-6">
                  <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/70 mb-2">
                    {step === 1 ? "// criar conta" : "// completar perfil"}
                  </p>
                  <h1 className="text-2xl font-bold text-gray-100">
                    {step === 1 ? "Comece a sua jornada" : "Quase lá"}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {step === 1
                      ? "Crie a sua conta gratuita"
                      : "Precisamos de mais alguns dados"}
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      className="mb-5 flex items-start gap-2.5 border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── STEP 1 ─────────────────────────── */}
                {step === 1 && (
                  <form onSubmit={goToStep2} className="space-y-4">
                    {/* Nome */}
                    <motion.div className="space-y-1.5" {...fieldAnim} transition={{ duration: 0.4, delay: 0.06, ease: EASE }}>
                      <label htmlFor="name" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                        Nome completo
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                        <input
                          id="name" type="text" required autoComplete="name"
                          disabled={isAnyLoading} placeholder="João Silva"
                          value={name} onChange={(e) => setName(e.target.value)}
                          className="auth-input block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-700 focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                        />
                      </div>
                    </motion.div>

                    {/* Email */}
                    <motion.div className="space-y-1.5" {...fieldAnim} transition={{ duration: 0.4, delay: 0.12, ease: EASE }}>
                      <label htmlFor="email" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                        <input
                          id="email" type="email" required autoComplete="email"
                          disabled={isAnyLoading} placeholder="email@exemplo.com"
                          value={email} onChange={(e) => setEmail(e.target.value)}
                          className="auth-input block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-700 focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                        />
                      </div>
                    </motion.div>

                    {/* Password + Confirmar — lado a lado */}
                    <motion.div className="grid grid-cols-2 gap-3" {...fieldAnim} transition={{ duration: 0.4, delay: 0.18, ease: EASE }}>
                      <div className="space-y-1.5">
                        <label htmlFor="password" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                          Senha
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                          <input
                            id="password" type={showPassword ? "text" : "password"} required
                            autoComplete="new-password" disabled={isAnyLoading} placeholder="••••••"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            className="auth-input block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-8 text-sm text-gray-100 placeholder-gray-700 focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                          />
                          <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="confirm" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                          Confirmar
                        </label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                          <input
                            id="confirm" type={showConfirm ? "text" : "password"} required
                            autoComplete="new-password" disabled={isAnyLoading} placeholder="••••••"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className="auth-input block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-8 text-sm text-gray-100 placeholder-gray-700 focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                          />
                          <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                            {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div {...fieldAnim} transition={{ duration: 0.4, delay: 0.24, ease: EASE }}>
                      <motion.button
                        type="submit"
                        disabled={isAnyLoading}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-2 flex w-full items-center justify-center gap-2 bg-purple py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-light disabled:opacity-60"
                      >
                        Continuar <ChevronRight className="h-4 w-4" />
                      </motion.button>
                    </motion.div>

                    {/* Divisor + Social */}
                    <motion.div {...fieldAnim} transition={{ duration: 0.4, delay: 0.3, ease: EASE }}>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 border-t border-gray-800" />
                        <span className="text-[13px] font-mono uppercase tracking-widest text-gray-700">ou</span>
                        <div className="flex-1 border-t border-gray-800" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          disabled={isAnyLoading}
                          onClick={() => handleSocial(new GoogleAuthProvider(), "Google")}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center justify-center gap-2 border border-gray-800 bg-gray-900 py-2.5 text-sm font-medium text-gray-400 hover:border-gray-700 hover:text-gray-200 disabled:opacity-50 transition-colors"
                        >
                          {socialLoading === "Google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
                          Google
                        </motion.button>
                        <motion.button
                          type="button"
                          disabled={isAnyLoading}
                          onClick={() => handleSocial(new GithubAuthProvider(), "GitHub")}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center justify-center gap-2 border border-gray-800 bg-gray-900 py-2.5 text-sm font-medium text-gray-400 hover:border-gray-700 hover:text-gray-200 disabled:opacity-50 transition-colors"
                        >
                          {socialLoading === "GitHub" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GithubIcon className="h-4 w-4" />}
                          GitHub
                        </motion.button>
                      </div>
                    </motion.div>
                  </form>
                )}

                {/* ── STEP 2 ─────────────────────────── */}
                {step === 2 && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Telefone */}
                      <motion.div className="col-span-full space-y-1.5" {...fieldAnim} transition={{ duration: 0.4, delay: 0.04, ease: EASE }}>
                        <label htmlFor="telefone" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                          Telefone
                        </label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                          <input
                            id="telefone" type="tel" required disabled={isAnyLoading}
                            placeholder="+244 900 000 000"
                            value={telefone} onChange={(e) => setTelefone(e.target.value)}
                            className="auth-input block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-700 focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                          />
                        </div>
                      </motion.div>

                      {/* Idade */}
                      <motion.div className="space-y-1.5" {...fieldAnim} transition={{ duration: 0.4, delay: 0.08, ease: EASE }}>
                        <label htmlFor="idade" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                          Idade
                        </label>
                        <div className="relative">
                          <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                          <input
                            id="idade" type="number" required min="12" max="120"
                            disabled={isAnyLoading} placeholder="18"
                            value={idade} onChange={(e) => setIdade(e.target.value)}
                            className="auth-input block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-700 focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                          />
                        </div>
                      </motion.div>

                      {/* Género */}
                      <motion.div className="space-y-1.5" {...fieldAnim} transition={{ duration: 0.4, delay: 0.12, ease: EASE }}>
                        <label htmlFor="genero" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                          Género
                        </label>
                        <select
                          id="genero" required disabled={isAnyLoading}
                          value={genero} onChange={(e) => setGenero(e.target.value)}
                          className="auth-input block w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-100 focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors appearance-none"
                        >
                          <option value="" disabled className="bg-gray-900">Selecionar</option>
                          <option value="Masculino" className="bg-gray-900">Masculino</option>
                          <option value="Feminino" className="bg-gray-900">Feminino</option>
                          <option value="Outro" className="bg-gray-900">Outro</option>
                        </select>
                      </motion.div>

                      {/* País */}
                      <motion.div className="space-y-1.5" {...fieldAnim} transition={{ duration: 0.4, delay: 0.16, ease: EASE }}>
                        <label htmlFor="pais" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                          País
                        </label>
                        <div className="relative">
                          <Globe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                          <input
                            id="pais" type="text" required disabled={isAnyLoading} placeholder="Angola"
                            value={pais} onChange={(e) => setPais(e.target.value)}
                            className="auth-input block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-700 focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                          />
                        </div>
                      </motion.div>

                      {/* Nacionalidade */}
                      <motion.div className="space-y-1.5" {...fieldAnim} transition={{ duration: 0.4, delay: 0.2, ease: EASE }}>
                        <label htmlFor="nacionalidade" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                          Nacionalidade
                        </label>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                          <input
                            id="nacionalidade" type="text" required disabled={isAnyLoading} placeholder="Angolana"
                            value={nacionalidade} onChange={(e) => setNacionalidade(e.target.value)}
                            className="auth-input block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-700 focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                          />
                        </div>
                      </motion.div>

                      {/* Morada — full width */}
                      <motion.div className="col-span-full space-y-1.5" {...fieldAnim} transition={{ duration: 0.4, delay: 0.24, ease: EASE }}>
                        <label htmlFor="morada" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                          Morada
                        </label>
                        <input
                          id="morada" type="text" required disabled={isAnyLoading}
                          placeholder="Rua Principal, 123, Luanda"
                          value={morada} onChange={(e) => setMorada(e.target.value)}
                          className="auth-input block w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-100 placeholder-gray-700 focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors"
                        />
                      </motion.div>
                    </div>

                    {/* Botões */}
                    <motion.div className="flex gap-3 mt-2" {...fieldAnim} transition={{ duration: 0.4, delay: 0.3, ease: EASE }}>
                      <motion.button
                        type="button"
                        onClick={() => { setStep(1); setError(""); }}
                        disabled={isAnyLoading}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-1.5 border border-gray-800 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-700 transition-colors disabled:opacity-50"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                      </motion.button>
                      <motion.button
                        type="submit"
                        disabled={isAnyLoading}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-1 items-center justify-center gap-2 bg-purple py-2.5 text-sm font-bold text-white hover:bg-purple-light disabled:opacity-60 transition-colors"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Criar conta grátis <ArrowRight className="h-3.5 w-3.5" /></>}
                      </motion.button>
                    </motion.div>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Links de rodapé */}
            <motion.p
              className="mt-8 text-center text-sm text-gray-600"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
            >
              Ao criar conta aceita os{" "}
              <TransitionLink href="/terms" className="hover:text-gray-400 transition-colors underline underline-offset-2">
                Termos de Uso
              </TransitionLink>
              {" "}e a{" "}
              <TransitionLink href="/privacy" className="hover:text-gray-400 transition-colors underline underline-offset-2">
                Política de Privacidade
              </TransitionLink>
            </motion.p>
          </div>
        </div>
      </div>
    </main>
    </PageTransition>
  );
}
