"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail, Lock, Loader2, AlertCircle, CheckCircle2,
  Eye, EyeOff, ArrowRight, BookOpen, Building2,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { GoogleIcon, GithubIcon } from "@/components/ui/AuthIcons";
import { AuthCarousel } from "@/components/AuthCarousel";

// Role → redirect map
function getRoleRedirect(role: string, fallback: string): string {
  if (role === "admin") return fallback === "/dashboard" ? "/admin" : fallback;
  if (role === "teacher") return fallback === "/dashboard" ? "/dashboard/teacher" : fallback;
  if (role === "institution") return fallback === "/dashboard" ? "/dashboard/institution" : fallback;
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("redirect");
    if (r && r.startsWith("/") && !r.startsWith("//") && !r.includes("://")) setRedirectTo(r);
    if (params.get("view") === "forgot") setView("forgot");
  }, []);

  const resetMessages = () => { setError(""); setSuccessMsg(""); };

  const toggleView = (v: "login" | "forgot") => {
    setView(v);
    resetMessages();
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      if (view === "login") {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const snap = await getDoc(doc(db, "users", cred.user.uid));
        const role = snap.exists() ? snap.data().role : "aluno";
        router.push(getRoleRedirect(role, redirectTo));
      } else {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setSuccessMsg("Link enviado. Verifique a sua caixa de entrada e a pasta de spam.");
        } else if (res.status === 404) {
          setError("Não existe conta com este email.");
        } else {
          setError(data?.error || "Erro ao enviar o email de recuperação.");
        }
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const messages: Record<string, string> = {
        "auth/invalid-email": "Formato de email inválido.",
        "auth/user-disabled": "Esta conta foi desativada.",
        "auth/user-not-found": "Não existe conta com este email.",
        "auth/wrong-password": "Senha incorreta.",
        "auth/invalid-credential": "Email ou senha incorretos.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
      };
      setError(messages[code] ?? "Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: "google" | "github") => {
    resetMessages();
    setSocialLoading(provider);
    try {
      const authProvider = provider === "google" ? new GoogleAuthProvider() : new GithubAuthProvider();
      const result = await signInWithPopup(auth, authProvider);
      const snap = await getDoc(doc(db, "users", result.user.uid));
      if (!snap.exists()) {
        // Conta social sem perfil → criar conta
        router.push("/register");
        return;
      }
      router.push(getRoleRedirect(snap.data().role, redirectTo));
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      if (code === "auth/account-exists-with-different-credential") {
        setError("Já existe uma conta com este email. Use outro método de login.");
      } else {
        setError(`Erro ao autenticar com ${provider}. Tente novamente.`);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const isAnyLoading = loading || socialLoading !== null;

  return (
    <main className="flex min-h-screen bg-gray-950">
      {/* Carousel — lado esquerdo */}
      <AuthCarousel />

      {/* Form — lado direito */}
      <div className="relative flex flex-1 flex-col overflow-y-auto">
        {/* Fundo */}
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.06]" />
        <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] bg-purple/8 blur-[120px]" />

        {/* Header */}
        <header className="flex items-center justify-between px-8 pt-8 pb-4 relative z-10">
          <Link href="/" className="flex items-center gap-2.5 lg:invisible">
            <img src="/Logo-Academy-White.svg" alt="Academy" className="h-9 w-auto brightness-0 invert" />
            <span className="text-base font-bold text-white">Netsulwel</span>
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Criar conta
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        {/* Formulário */}
        <div className="flex flex-1 flex-col justify-center px-8 py-8 relative z-10">
          <div className="mx-auto w-full max-w-[360px]">

            {/* Eyebrow */}
            <div className="mb-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple/70 mb-3">
                {view === "login" ? "// acesso à plataforma" : "// recuperação de acesso"}
              </p>
              <h1 className="text-2xl font-bold text-gray-100">
                {view === "login" ? "Bem-vindo de volta" : "Recuperar senha"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {view === "login"
                  ? "Entre na sua conta Netsulwel Academy"
                  : "Enviaremos um link para o seu email"}
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 flex items-start gap-2.5 border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="mb-6 flex items-start gap-2.5 border border-green-500/20 bg-green-500/8 px-4 py-3 text-sm text-green-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{successMsg}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    disabled={isAnyLoading}
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full border border-gray-800 bg-gray-900/60 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder-gray-700 transition-colors focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password — só no login */}
              {view === "login" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Palavra-passe
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleView("forgot")}
                      className="text-xs text-gray-600 hover:text-purple/80 transition-colors"
                    >
                      Esqueceu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      disabled={isAnyLoading}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full border border-gray-800 bg-gray-900/60 py-2.5 pl-9 pr-10 text-sm text-gray-100 placeholder-gray-700 transition-colors focus:border-purple/60 focus:outline-none focus:bg-gray-900 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember me */}
              {view === "login" && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isAnyLoading}
                    className="h-3.5 w-3.5 cursor-pointer"
                    style={{ accentColor: "var(--purple)" }}
                  />
                  <span className="text-xs text-gray-600">Manter sessão ativa</span>
                </label>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isAnyLoading || (view === "forgot" && !!successMsg)}
                className="mt-2 flex w-full items-center justify-center gap-2 bg-purple py-2.5 text-sm font-bold text-white transition-all hover:bg-purple-light disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : view === "login" ? (
                  <>Entrar <ArrowRight className="h-3.5 w-3.5" /></>
                ) : (
                  "Enviar link de recuperação"
                )}
              </button>

              {view === "forgot" && (
                <button
                  type="button"
                  onClick={() => toggleView("login")}
                  className="w-full text-center text-xs text-gray-600 hover:text-gray-400 transition-colors pt-1"
                >
                  ← Voltar ao login
                </button>
              )}
            </form>

            {/* Divisor + Social */}
            {view === "login" && (
              <>
                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-800" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gray-700">ou</span>
                  <div className="flex-1 border-t border-gray-800" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(["google", "github"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      disabled={isAnyLoading}
                      onClick={() => handleSocial(p)}
                      className="flex items-center justify-center gap-2 border border-gray-800 bg-gray-900/50 py-2.5 text-sm font-medium text-gray-400 transition-all hover:border-gray-700 hover:text-gray-200 disabled:opacity-50"
                    >
                      {socialLoading === p ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : p === "google" ? (
                        <GoogleIcon className="h-4 w-4" />
                      ) : (
                        <GithubIcon className="h-4 w-4" />
                      )}
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Footer */}
            <div className="mt-8 space-y-4">
              <p className="text-center text-xs text-gray-600">
                Sem conta?{" "}
                <Link href="/register" className="text-purple/80 hover:text-purple-light font-semibold transition-colors">
                  Registar grátis
                </Link>
              </p>

              {/* Quick access — Professor / Instituição */}
              <div className="flex gap-2 pt-2 border-t border-gray-800/50">
                <Link
                  href="/register/teacher"
                  className="flex flex-1 items-center justify-center gap-1.5 border border-gray-800 bg-gray-900/30 py-2 text-xs text-gray-600 hover:border-green/30 hover:text-green/70 transition-all"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Sou professor
                </Link>
                <Link
                  href="/register/institution"
                  className="flex flex-1 items-center justify-center gap-1.5 border border-gray-800 bg-gray-900/30 py-2 text-xs text-gray-600 hover:border-blue-500/30 hover:text-blue-400/70 transition-all"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Instituição
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
