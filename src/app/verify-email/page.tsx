"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const { user, loading: authLoading } = useAuth();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  // Guardar o email antes do redirect (user pode ser null depois)
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (auth.currentUser?.email) {
      setUserEmail(auth.currentUser.email);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
  }, [authLoading, user, router]);

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

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setResending(true);
    setError("");
    try {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
      setTimeout(() => setSent(false), 8000);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      setError(
        code === "auth/too-many-requests"
          ? "Muitos reenvios. Aguarde alguns minutos."
          : "Erro ao reenviar. Tente novamente."
      );
    } finally {
      setResending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-6 w-6 animate-spin text-purple/60" />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      {/* Fundo */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.06]" />
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-[400px] w-[600px] bg-purple/10 blur-[120px]" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-20">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
          <img src="/Logo-Academy-White.svg" alt="Academy" className="h-9 w-auto brightness-0 invert" />
          <span className="text-base font-bold text-white">Netsulwel</span>
        </Link>
        <Link href="/login" className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
          Voltar ao login
        </Link>
      </header>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px]">

        {/* Ícone */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center border border-purple/30 bg-purple/10">
            <Mail className="h-6 w-6 text-purple-light" />
          </div>
          <div className="mt-4 h-px w-8 bg-purple/30" />
        </div>

        {/* Título */}
        <div className="mb-6 text-center">
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60 mb-3">
            // verificação de conta
          </p>
          <h1 className="text-2xl font-bold text-gray-100">
            Verifique o seu email
          </h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Enviámos um link para{" "}
            <span className="font-medium text-gray-300">
              {userEmail ?? "o seu email"}
            </span>
            .<br />
            Clique no link para ativar a conta.
          </p>
        </div>

        {/* Alerts */}
        {sent && (
          <div className="mb-5 flex items-start gap-2.5 border border-green-500/20 bg-green-500/8 px-4 py-3 text-sm text-green-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Email reenviado. Verifique a caixa de entrada e a pasta de spam.</p>
          </div>
        )}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Acções */}
        <div className="space-y-3">
          <button
            onClick={handleCheck}
            disabled={checking || resending}
            className="flex w-full items-center justify-center gap-2 bg-purple py-3 text-sm font-bold text-white hover:bg-purple-light disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {checking ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> A verificar...</>
            ) : (
              <>Já verifiquei o email <ArrowRight className="h-4 w-4" /></>
            )}
          </button>

          <button
            onClick={handleResend}
            disabled={resending || checking || sent}
            className="flex w-full items-center justify-center gap-2 border border-gray-800 bg-gray-900 py-3 text-sm font-medium text-gray-400 hover:border-gray-700 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {resending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> A enviar...</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> Reenviar email</>
            )}
          </button>
        </div>

        {/* Nota */}
        <div className="mt-8 border-t border-gray-800 pt-6">
          <p className="text-sm text-gray-600 leading-relaxed text-center">
            Não recebeu? Verifique a pasta de <strong className="text-gray-500">spam</strong>.
            O email pode demorar alguns minutos.
          </p>
          <p className="mt-3 text-center text-sm">
            <Link href="/login" className="text-gray-600 hover:text-gray-400 transition-colors">
              ← Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <Loader2 className="h-6 w-6 animate-spin text-purple/60" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
