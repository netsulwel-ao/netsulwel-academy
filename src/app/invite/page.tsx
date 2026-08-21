"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Loader2, Check, LogIn, UserPlus } from "lucide-react";

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { user, loading } = useAuth();
  const [institution, setInstitution] = useState<any>(null);
  const [institutionId, setInstitutionId] = useState("");
  const [inviteRole, setInviteRole] = useState<"student" | "teacher">("student");
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  // Auto-accept when user is logged in and institution data is loaded
  useEffect(() => {
    if (loading) return;
    if (!user || !institutionId || !token) return;
    if (accepted || accepting) return;
    handleAccept();
  }, [user, loading, institutionId, token]);

  useEffect(() => {
    if (!token) { setError("Link inválido."); return; }
    fetch(`/api/institutions/invite-link/accept?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setInstitution(data.institution);
        setInstitutionId(data.institutionId);
        if (data.role === "teacher") setInviteRole("teacher");
      })
      .catch(() => setError("Erro ao validar link."));
  }, [token]);

  const handleAccept = async () => {
    if (!user || !token) return;
    setAccepting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/institutions/invite-link/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ token, userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAccepted(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao aceitar convite.");
    } finally {
      setAccepting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-8 text-center">
          <Building2 className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Link Inválido</h1>
          <p className="text-gray-400">{error}</p>
          <Link href="/" className="mt-6 inline-block text-purple hover:text-purple-light font-medium">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="relative overflow-hidden max-w-lg w-full bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-10 text-center shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full" />
          <div className="relative animate-in zoom-in-95 duration-500">
            <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 border border-green-500/30 shadow-lg shadow-green-500/20">
              <Check className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo!</h1>
            <p className="text-gray-300 mb-2">Foste adicionado com sucesso a</p>
            <p className="text-xl font-bold text-green-400 mb-6">{institution?.name}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              A redirecionar para o teu painel...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{institution?.name}</h1>
            <p className="text-sm text-gray-400">Convite para Instituição</p>
          </div>
        </div>

        <p className="text-gray-300 mb-8">
          Foste convidado para te juntares a esta instituição. Ao aceitares, terás acesso aos cursos e conteúdos da instituição.
        </p>

        {!user ? (
          <div className="space-y-3">
            <Link href={`/login?redirect=/invite?token=${token}`}
              className="flex items-center justify-center gap-2 w-full bg-purple hover:bg-purple-light text-white font-bold py-3 transition-colors">
              <LogIn className="h-5 w-5" />Fazer Login
            </Link>
            <Link href={`${inviteRole === "teacher" ? "/register/teacher" : "/register"}?redirect=/invite?token=${token}`}
              className="flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 transition-colors border border-gray-700">
              <UserPlus className="h-5 w-5" />Criar Conta
            </Link>
          </div>
        ) : (
          <button onClick={handleAccept} disabled={accepting}
            className="flex items-center justify-center gap-2 w-full bg-purple hover:bg-purple-light text-white font-bold py-3 transition-colors disabled:opacity-50">
            {accepting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            Aceitar Convite
          </button>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>}>
      <InviteContent />
    </Suspense>
  );
}