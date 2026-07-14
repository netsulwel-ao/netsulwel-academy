"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AccessPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "authenticating" | "processing" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");

  const token = params.token as string;

  // Efeito para validar o link
  useEffect(() => {
    const validateLink = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Link inválido");
        return;
      }

      // Se não está autenticado, redirecionar para login
      if (authLoading) return; // Esperar autenticação carregar

      if (!user) {
        setStatus("authenticating");
        setMessage("Redirecionando para autenticação...");
        // Redirecionar para login com intent de retornar para este link
        router.push(`/login?redirect=/access/${token}`);
        return;
      }

      // Usuário autenticado, validar o link
      setStatus("processing");
      setMessage("Processando seu acesso...");

      try {
        const response = await fetch(
          `/api/access/private-link/${token}`,
          {
            method: "GET",
            headers: {
              "X-User-ID": user.uid,
              "Authorization": `Bearer ${await user.getIdToken()}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setMessage(data.error || "Não foi possível processar o link");
          toast.error(data.error);
          return;
        }

        setStatus("success");
        setMessage("Acesso concedido! Redirecionando...");
        setRedirectUrl(data.redirectTo);
        toast.success("Bem-vindo!");

        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push(data.redirectTo);
        }, 2000);
      } catch (error) {
        console.error("Erro ao validar link:", error);
        setStatus("error");
        setMessage("Erro ao processar link. Tente novamente.");
        toast.error("Erro ao processar link");
      }
    };

    validateLink();
  }, [token, user, authLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-gray-900">
      <div className="w-full max-w-md mx-auto px-4 py-8 sm:px-6">
        <div className="bg-card rounded-lg border border-gray-700 p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-purple animate-spin mb-4" />
              <p className="text-gray-400">Validando link...</p>
            </>
          )}

          {status === "authenticating" && (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-purple animate-spin mb-4" />
              <p className="text-gray-300 mb-2">Autenticação necessária</p>
              <p className="text-sm text-gray-400">Redirecionando para login...</p>
            </>
          )}

          {status === "processing" && (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-purple animate-spin mb-4" />
              <p className="text-gray-300 mb-2">{message}</p>
              <p className="text-sm text-gray-400">Isso pode levar alguns segundos</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-green mb-4" />
              <p className="text-gray-300 mb-2">Acesso Concedido!</p>
              <p className="text-sm text-gray-400 mb-4">
                Você está sendo redirecionado...
              </p>
              <a
                href={redirectUrl}
                className="inline-block px-4 py-2 bg-purple hover:bg-purple-light text-white rounded-lg transition-colors"
              >
                Ir Agora
              </a>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <p className="text-gray-300 mb-2">Erro ao Processar Link</p>
              <p className="text-sm text-gray-400 mb-4">{message}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 bg-purple hover:bg-purple-light text-white rounded-lg transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2 border border-gray-600 hover:border-gray-400 text-gray-300 rounded-lg transition-colors"
                >
                  Home
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Link privado fornecido por seu professor</p>
        </div>
      </div>
    </div>
  );
}
