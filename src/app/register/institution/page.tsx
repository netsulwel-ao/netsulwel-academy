"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { Building2, Mail, Phone, MapPin, User, Lock, Loader2, Eye, EyeOff, AlertCircle, Sun, Moon } from "lucide-react";
import Link from "next/link";

export default function InstitutionRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Step 1 — admin account
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 — institution details
  const [instName, setInstName] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instPhone, setInstPhone] = useState("");
  const [instAddress, setInstAddress] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("public-theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const togglePublicTheme = () => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("public-theme", next);
      return next;
    });
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!adminName.trim()) { setError("O nome do administrador é obrigatório."); return; }
    if (/\d/.test(adminName)) { setError("O nome não pode conter números."); return; }
    if (!adminEmail.trim()) { setError("O email é obrigatório."); return; }
    if (adminPassword.length < 6) { setError("A palavra-passe deve ter pelo menos 6 caracteres."); return; }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!instName.trim() || !instEmail.trim()) {
      setError("Nome e email da instituição são obrigatórios.");
      return;
    }
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      if (adminName) await updateProfile(userCredential.user, { displayName: adminName });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: adminEmail,
        name: adminName,
        role: "institution",
        createdAt: new Date(),
      });

      const token = await userCredential.user.getIdToken();

      const res = await fetch("/api/institutions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: instName,
          email: instEmail,
          phone: instPhone || null,
          address: instAddress || null,
          adminId: userCredential.user.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registar instituição.");

      await sendEmailVerification(userCredential.user);
      router.push("/verify-email");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      const messages: Record<string, string> = {
        "auth/email-already-in-use": "Este email já está registado. Tente fazer login.",
        "auth/weak-password": "A palavra-passe deve ter pelo menos 6 caracteres.",
        "auth/invalid-email": "O formato do email é inválido.",
        "auth/too-many-requests": "Muitas tentativas. Espere alguns minutos e tente novamente.",
      };
      setError(messages[code] || (err instanceof Error ? err.message : "Erro ao criar conta."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-950 flex-col lg:flex-row overflow-hidden">
      <div className="relative hidden w-1/2 lg:flex flex-col items-center justify-center bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-gray-900 to-gray-950" />
        <Link href="/" className="absolute left-10 top-10 z-20 flex items-center gap-4 hover:opacity-80 transition-opacity">
          <img src="/Logo-Academy-White.svg" alt="Academy Logo" className="h-12 w-auto" />
          <span className="text-3xl font-light text-white/30">|</span>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Netsulwel" className="h-7 w-auto brightness-0 invert" />
            <span className="text-2xl font-bold text-white">Netsulwel</span>
          </div>
        </Link>
        <div className="absolute bottom-16 left-10 right-10 z-20">
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">Registe a sua instituição</h2>
          <p className="mt-4 text-lg text-gray-300 max-w-lg">
            Crie uma instituição educativa, convide professores e alunos, e gerencie tudo num só lugar.
          </p>
        </div>
      </div>

      <div data-theme={theme} className="relative flex w-full flex-col lg:w-1/2 bg-gray-950 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-10" />
        <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[600px] w-[600px] bg-cyan/10 blur-[150px] hidden sm:block" />

        <div className="flex items-center justify-between p-6 z-20">
          <Link href="/" className="flex lg:hidden items-center gap-3">
            <img src="/Logo-Academy-White.svg" alt="Academy Logo" className="h-10 w-auto" />
            <img src="/logo.svg" alt="Netsulwel" className="h-6 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={togglePublicTheme} className="flex items-center justify-center h-9 w-9 border border-gray-800 bg-gray-900/60 hover:bg-gray-800 hover:border-gray-600 transition-all text-gray-400 hover:text-white">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/login" className="text-sm font-medium text-white px-6 py-2.5 border border-gray-800 bg-gray-900/60 hover:bg-gray-800 hover:border-gray-600 transition-all">
              Iniciar sessão
            </Link>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-16 lg:px-24 z-20 pb-12 lg:pb-0">
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className={`h-2 w-8 ${step === 1 ? "bg-cyan-400" : "bg-cyan-400"}`} />
              <div className={`h-2 w-8 ${step === 2 ? "bg-cyan-400" : "bg-gray-700"}`} />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {step === 1 ? "Criar conta" : "Dados da instituição"}
            </h2>
            <p className="mt-2 text-sm text-gray-400 mb-8">
              {step === 1
                ? "Primeiro, crie a sua conta de administrador"
                : "Agora, preencha os dados da sua instituição"}
            </p>

            <div className="border border-gray-800/50 bg-gray-900/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />

              {error && (
                <div className="mb-6 flex items-center gap-2 bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 relative z-10">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {step === 1 ? (
                <form className="space-y-5 relative z-10" onSubmit={handleStep1}>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300" htmlFor="admin-name">Nome do administrador</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input id="admin-name" type="text" required placeholder="João Silva"
                        value={adminName} onChange={(e) => setAdminName(e.target.value)}
                        className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300" htmlFor="admin-email">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input id="admin-email" type="email" required placeholder="admin@exemplo.com"
                        value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                        className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300" htmlFor="admin-password">Palavra-passe</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input id="admin-password" type={showPassword ? "text" : "password"} required
                        placeholder="••••••••" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                        className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-10 text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 focus:outline-none">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Mínimo de 6 caracteres</p>
                  </div>
                  <button type="submit"
                    className="mt-6 flex w-full items-center justify-center gap-2 bg-cyan-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-cyan-500">
                    Continuar
                  </button>
                </form>
              ) : (
                <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300" htmlFor="inst-name">Nome da Instituição</label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input id="inst-name" type="text" required disabled={loading}
                        placeholder="Ex: Escola Secundária de Luanda"
                        value={instName} onChange={(e) => setInstName(e.target.value)}
                        className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300" htmlFor="inst-email">Email da Instituição</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input id="inst-email" type="email" required disabled={loading}
                        placeholder="contacto@escola.pt"
                        value={instEmail} onChange={(e) => setInstEmail(e.target.value)}
                        className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300" htmlFor="inst-phone">Telefone</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input id="inst-phone" type="tel" disabled={loading} placeholder="+244 923 000 000"
                        value={instPhone} onChange={(e) => setInstPhone(e.target.value)}
                        className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300" htmlFor="inst-address">Morada</label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input id="inst-address" type="text" disabled={loading} placeholder="Rua da Escola, 123, Luanda"
                        value={instAddress} onChange={(e) => setInstAddress(e.target.value)}
                        className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50" />
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-500/5 border border-yellow-500/20">
                    <p className="text-xs text-yellow-400">
                      Após o registo, a instituição ficará em estado <strong>pendente</strong> até ser aprovada pela administração.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} disabled={loading}
                      className="flex items-center justify-center gap-2 border border-gray-700 bg-gray-900 py-3.5 px-6 text-sm font-medium text-gray-300 transition-all hover:bg-gray-800 disabled:opacity-50">
                      Voltar
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Registar Instituição"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <p className="mt-8 text-center text-sm text-gray-400 relative z-20">
              Já tem conta? <Link href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Iniciar sessão</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}