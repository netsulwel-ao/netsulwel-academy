"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Loader2, CheckCircle2, AlertCircle, RefreshCw, Sun, Moon, ArrowRight } from "lucide-react";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const { user, loading } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("public-theme") as "dark" | "light" | null;
    if (saved && saved !== theme) setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [loading, user, router]);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setResending(true);
    setError("");
    try {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch {
      setError("Erro ao reenviar. Tente novamente.");
    } finally {
      setResending(false);
    }
  };

  const handleCheck = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    setError("");
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        router.push(redirectTo);
      } else {
        setError("Email ainda não verificado. Verifique a sua caixa de entrada.");
      }
    } catch {
      setError("Erro ao verificar. Tente novamente.");
    } finally {
      setChecking(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("public-theme", next);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex flex-col items-center justify-center px-4" data-theme={theme}>
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Aurora Gradients */}
        <div className="absolute top-0 right-1/4 w-96 h-96 md:w-[900px] md:h-[900px] bg-gradient-to-br from-purple-500/20 to-indigo-500/10 blur-3xl md:blur-[500px] rounded-full" />
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 md:w-[700px] md:h-[700px] bg-gradient-to-tr from-indigo-500/10 to-purple-500/5 blur-3xl md:blur-[500px] rounded-full" />
        
        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.5" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 px-6 md:px-20 py-6 md:py-8 flex items-center justify-between z-40">
        <Link href="/" className="flex items-center gap-3 hover:opacity-75 transition-opacity">
          <img src="/Logo-Academy-White.svg" alt="Academy" className="h-10 md:h-12 w-auto" />
          <span className="text-xl md:text-2xl font-bold text-white">Netsulwel</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-700/50 bg-white/5 hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
        >
          {!mounted || theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      {/* Centered Content */}
      <div className="relative z-20 w-full max-w-md">
        <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
          
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/40 to-indigo-500/30 flex items-center justify-center">
              <Mail className="h-8 w-8 text-purple-200" />
            </div>
          </div>

          {/* Title and Description */}
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Verifique o seu email
          </h1>
          <p className="text-center text-gray-300 mb-8">
            Enviámos um link de verificação para <br />
            <strong className="text-white text-sm break-all">{auth.currentUser?.email}</strong>
            <br />
            Clique no link para ativar a sua conta.
          </p>

          {/* Success Message */}
          {sent && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex gap-3 text-sm text-green-300 animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>Email reenviado com sucesso. Verifique a sua caixa.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3 text-sm text-red-300 animate-in fade-in">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 mb-8">
            <button
              onClick={handleCheck}
              disabled={checking}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Já verifiquei o email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full h-14 rounded-2xl border border-gray-600/50 bg-white/5 hover:bg-white/10 transition-colors font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Reenviando...</span>
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5" />
                  <span>Reenviar email</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Links */}
          <div className="border-t border-gray-700/30 pt-6 space-y-3 text-center">
            <p className="text-sm text-gray-400">
              Não recebeu o email?{" "}
              <span className="text-gray-500">
                Verifique a pasta de spam ou solicitações outro link abaixo.
              </span>
            </p>
            <p className="text-sm">
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Voltar ao login
              </Link>
            </p>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 space-y-3">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white">Dica:</span> O email de verificação pode levar alguns minutos. Verifique sua caixa de spam.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
