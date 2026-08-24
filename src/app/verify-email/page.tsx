"use client";

import { Suspense, useState, useEffect } from "react";
import {
  Mail, Loader2, CheckCircle2, AlertCircle, ArrowRight, RefreshCw,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { PageTransition } from "@/components/PageTransition";
import { TransitionLink } from "@/components/TransitionLink";

const EASE = [0.16, 1, 0.3, 1] as const;

async function forceTokenRefresh() {
  try {
    const user = auth.currentUser;
    if (user) {
      const tokenResult = await user.getIdToken(true);
      return !!tokenResult;
    }
  } catch { /* ignore */ }
  return false;
}

function VerifyEmailContent() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const success = searchParams.get("success");
  const errorParam = searchParams.get("error");
  const { user, loading: authLoading } = useAuth();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
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

  // Handle success from API redirect — force token refresh to pick up emailVerified
  useEffect(() => {
    if (success === "true") {
      (async () => {
        await forceTokenRefresh();
        await auth.currentUser?.reload();
        setVerified(true);
      })();
    }
  }, [success]);

  // Handle error from API redirect
  useEffect(() => {
    if (errorParam === "expired") setError("Link expirado. Solicite um novo email de verificação.");
    else if (errorParam === "invalid_token") setError("Link inválido ou já utilizado.");
    else if (errorParam === "server_error") setError("Erro ao verificar. Tente novamente.");
  }, [errorParam]);

  const handleCheck = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    setError("");
    try {
      // Force token refresh to get updated emailVerified claim
      await forceTokenRefresh();
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setVerified(true);
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
    setSent(false);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail || auth.currentUser?.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.skipped) {
        setError(
          data.reason === "smtp_not_configured"
            ? "Serviço de email não configurado. Contacte o administrador."
            : data.reason === "admin_init_error"
            ? "Erro de configuração. Contacte o administrador."
            : "Email não enviado. Tente novamente mais tarde."
        );
      } else {
        setSent(true);
        setTimeout(() => setSent(false), 8000);
      }
    } catch {
      setError("Erro ao reenviar. Tente novamente.");
    } finally {
      setResending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-6 w-6 animate-spin text-purple" />
      </div>
    );
  }

  if (!user) return null;

  // Verified success state
  if (verified) {
    return (
      <PageTransition type="auth">
        <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
          <motion.div
            className="w-full max-w-md text-center space-y-6"
            initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Email verificado!</h1>
            <p className="text-gray-400">
              A sua conta foi ativada com sucesso.
            </p>
            <button
              onClick={() => router.push(redirectTo)}
              className="inline-flex items-center gap-2 bg-purple hover:bg-purple-light text-white font-bold py-3 px-8 transition-colors"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition type="auth">
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <motion.div
          className="w-full max-w-md space-y-6"
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple/10 mx-auto">
              <Mail className="h-8 w-8 text-purple" />
            </div>
            <h1 className="text-2xl font-bold text-white">Verifique o seu email</h1>
            <p className="text-gray-400 text-sm">
              Enviamos um link de verificação para<br />
              <span className="text-white font-medium">{userEmail || user?.email}</span>
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-3"
            >
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          {sent && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-4 py-3"
            >
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <p className="text-sm text-green-300">Email reenviado com sucesso!</p>
            </motion.div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleCheck}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 bg-purple hover:bg-purple-light text-white font-bold py-3 px-4 transition-colors disabled:opacity-50"
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {checking ? "A verificar..." : "Já verifiquei o email"}
            </button>

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-medium py-3 px-4 transition-colors disabled:opacity-50"
            >
              {resending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {resending ? "A reenviar..." : "Reenviar email"}
            </button>
          </div>

          <div className="text-center">
            <TransitionLink
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Voltar ao login
            </TransitionLink>
          </div>
        </motion.div>
      </main>
    </PageTransition>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-6 w-6 animate-spin text-purple" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
