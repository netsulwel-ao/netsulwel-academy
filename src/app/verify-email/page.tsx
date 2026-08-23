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

function VerifyEmailContent() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const { user, loading: authLoading } = useAuth();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
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
      await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail || auth.currentUser?.email }),
      });
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
        <Loader2 className="h-6 w-6 animate-spin text-purple" />
      </div>
    );
  }

  const fieldAnim = reduceMotion
    ? {}
    : { initial: { opacity: 0, x: -14 }, animate: { opacity: 1, x: 0 } };

  return (
    <PageTransition type="auth">
    <main className="flex min-h-screen bg-gray-950">
      <div className="relative flex flex-1 flex-col overflow-y-auto">
        {/* Fundo */}
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.06]" />
        <motion.div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] bg-purple/10 blur-[120px]"
          animate={reduceMotion ? {} : { opacity: [0.5, 0.9, 0.5], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Header */}
        <motion.header
          className="flex items-center justify-between px-8 pt-8 pb-4 relative z-10"
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <TransitionLink href="/" className="group flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowRight className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            Voltar
          </TransitionLink>
          <TransitionLink
            href="/login"
            className="group flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Entrar
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </TransitionLink>
        </motion.header>

        {/* Conteúdo */}
        <div className="flex flex-1 flex-col justify-center px-8 py-8 relative z-10">
          <div className="mx-auto w-full max-w-[400px]">

            {/* Eyebrow */}
            <motion.div
              className="mb-8 flex flex-col items-center"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <div className="flex h-14 w-14 items-center justify-center border border-purple bg-purple/10">
                <Mail className="h-6 w-6 text-purple-light" />
              </div>
              <div className="mt-4 h-px w-8 bg-purple/30" />
            </motion.div>

            {/* Título */}
            <motion.div
              className="mb-6 text-center"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
            >
              <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple mb-3">
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
            </motion.div>

            {/* Alerts */}
            {sent && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mb-5 flex items-start gap-2.5 border border-green-500 bg-green-500/8 px-4 py-3 text-sm text-green-400"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Email reenviado. Verifique a caixa de entrada e a pasta de spam.</p>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mb-5 flex items-start gap-2.5 border border-red-500 bg-red-500/8 px-4 py-3 text-sm text-red-400"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {/* Acções */}
            <div className="space-y-3">
              <motion.div {...fieldAnim} transition={{ duration: 0.4, delay: 0.12, ease: EASE }}>
                <motion.button
                  onClick={handleCheck}
                  disabled={checking || resending}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 bg-purple py-3 text-sm font-bold text-white hover:bg-purple-light disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {checking ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> A verificar...</>
                  ) : (
                    <>Já verifiquei o email <ArrowRight className="h-4 w-4" /></>
                  )}
                </motion.button>
              </motion.div>

              <motion.div {...fieldAnim} transition={{ duration: 0.4, delay: 0.18, ease: EASE }}>
                <motion.button
                  onClick={handleResend}
                  disabled={resending || checking || sent}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 border border-gray-800 bg-gray-900 py-3 text-sm font-medium text-gray-400 hover:border-gray-700 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {resending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> A enviar...</>
                  ) : (
                    <><RefreshCw className="h-4 w-4" /> Reenviar email</>
                  )}
                </motion.button>
              </motion.div>
            </div>

            {/* Nota */}
            <motion.div
              className="mt-8 border-t border-gray-800 pt-6"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
            >
              <p className="text-sm text-gray-600 leading-relaxed text-center">
                Não recebeu? Verifique a pasta de <strong className="text-gray-500">spam</strong>.
                O email pode demorar alguns minutos.
              </p>
              <p className="mt-3 text-center text-sm">
                <TransitionLink href="/login" className="text-gray-600 hover:text-gray-400 transition-colors">
                  &larr; Voltar ao login
                </TransitionLink>
              </p>
            </motion.div>

          </div>
        </div>
      </div>
    </main>
    </PageTransition>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <Loader2 className="h-6 w-6 animate-spin text-purple" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
