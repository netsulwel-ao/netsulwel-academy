"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md border border-gray-800/50 bg-gray-900/40 p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple/20">
          <Mail className="h-8 w-8 text-purple" />
        </div>

        <h1 className="text-2xl font-bold text-white">Verifique o seu email</h1>
        <p className="mt-3 text-sm text-gray-400">
          Enviámos um link de verificação para <strong className="text-white">{auth.currentUser?.email}</strong>.
          Clique no link para ativar a sua conta.
        </p>

        {sent && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Email reenviado com sucesso.
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="mt-8 space-y-3">
          <button onClick={handleCheck} disabled={checking}
            className="flex w-full items-center justify-center gap-2 bg-white py-3 text-sm font-bold text-gray-950 transition-all hover:bg-gray-200 disabled:opacity-70">
            {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
            Já verifiquei
          </button>

          <button onClick={handleResend} disabled={resending}
            className="flex w-full items-center justify-center gap-2 border border-gray-700 bg-gray-950/50 py-3 text-sm font-semibold text-white transition-all hover:border-gray-500 hover:bg-gray-800 disabled:opacity-50">
            {resending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
            Reenviar email
          </button>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          <Link href="/login" className="text-purple-light hover:text-purple transition-colors">Voltar ao login</Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
