"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Mail, Check, Loader2, X, GraduationCap, User } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>}>
      <AcceptInvitationInner />
    </Suspense>
  );
}

function AcceptInvitationInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token de convite inválido");
      setLoading(false);
      return;
    }

    const validateInvitation = async () => {
      try {
        const res = await fetch(`/api/institutions/invite/accept?token=${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to validate invitation");
        }
        
        setInvitation(data.invitation);
        setInstitution(data.institution);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao validar convite");
      } finally {
        setLoading(false);
      }
    };

    validateInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      toast.error("Deves estar autenticado para aceitar o convite.");
      router.push("/login");
      return;
    }

    setAccepting(true);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/institutions/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ token, userId: user.uid }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to accept invitation");
      }

      toast.success("Convite aceite com sucesso!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erro ao aceitar convite.");
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <X className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Convite Inválido</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-purple hover:bg-purple-light text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const RoleIcon = invitation?.role === "teacher" ? GraduationCap : User;
  const roleText = invitation?.role === "teacher" ? "Professor" : "Aluno";

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Convite para {institution?.name}</h1>
          <p className="text-gray-400">Foste convidado para te juntares a esta instituição.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xl">
                {institution?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{institution?.name}</h3>
                <p className="text-sm text-gray-400">{institution?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <RoleIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cargo: {roleText}</h3>
                <p className="text-sm text-gray-400">Vais ter acesso aos recursos desta instituição.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Email: {invitation?.email}</h3>
                <p className="text-sm text-gray-400">Este email será associado à tua conta.</p>
              </div>
            </div>
          </div>

          {!user ? (
            <div className="mt-8 space-y-4">
              <p className="text-center text-gray-400">
                Deves estar autenticado para aceitar este convite.
              </p>
              <button
                onClick={() => router.push(`/login?redirect=/institution/invite/accept?token=${token}`)}
                className="w-full bg-purple hover:bg-purple-light text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Iniciar Sessão
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    A aceitar...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Aceitar Convite
                  </>
                )}
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
