"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2, Mail, Phone, MapPin, User, Lock,
  Loader2, Eye, EyeOff, AlertCircle,
  ArrowRight, ArrowLeft, Users, BookOpen, Globe,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";


const PERKS = [
  { icon: Users,    label: "Gerencie alunos",     sub: "Acompanhe progresso em tempo real" },
  { icon: BookOpen, label: "Ofereça cursos",       sub: "Plataforma completa de educação" },
  { icon: Globe,    label: "Alcance global",       sub: "Expanda a sua instituição digitalmente" },
];

type Step = 1 | 2;

export default function InstitutionRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — conta admin
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 — dados da instituição
  const [instName, setInstName] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instPhone, setInstPhone] = useState("");
  const [instAddress, setInstAddress] = useState("");

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
    let createdUser: any = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      createdUser = cred.user;
      await updateProfile(cred.user, { displayName: adminName });
      await setDoc(doc(db, "users", cred.user.uid), {
        email: adminEmail,
        name: adminName,
        role: "institution",
        plan: "free",
        createdAt: new Date(),
      });
      const token = await cred.user.getIdToken();
      const res = await fetch("/api/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: instName,
          email: instEmail,
          phone: instPhone || null,
          address: instAddress || null,
          adminId: cred.user.uid,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registar instituição.");
      await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      });
      router.push("/verify-email");
    } catch (err: unknown) {
      if (createdUser) {
        try {
          await deleteDoc(doc(db, "users", createdUser.uid));
          await createdUser.delete();
        } catch {
          // cleanup best-effort
        }
      }
      const code = (err as { code?: string })?.code ?? "";
      const messages: Record<string, string> = {
        "auth/email-already-in-use": "Este email já está registado. Tente fazer login.",
        "auth/weak-password": "A palavra-passe deve ter pelo menos 6 caracteres.",
        "auth/invalid-email": "Formato de email inválido.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
      };
      setError(messages[code] ?? (err instanceof Error ? err.message : "Erro ao criar conta."));
      if (["auth/email-already-in-use", "auth/invalid-email", "auth/weak-password"].includes(code)) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  // Classe base para inputs
  const inputBase = "block w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:bg-gray-900 disabled:opacity-50 transition-colors";

  return (
    <main className="flex min-h-screen bg-gray-950">
      {/* Form */}
      <div className="relative flex flex-1 flex-col overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.06]" />
        <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] bg-blue-500/5 blur-[120px]" />

        {/* Header */}
        <header className="flex items-center justify-between px-8 pt-8 pb-4 relative z-10">
          <Link href="/" className="group flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowRight className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            Voltar
          </Link>
          <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Já tenho conta <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        {/* Conteúdo */}
        <div className="flex flex-1 flex-col justify-center px-8 py-8 relative z-10">
          <div className="mx-auto w-full max-w-[400px]">

            {/* Progress */}
            <div className="mb-6 flex items-center gap-0">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`flex h-6 w-6 items-center justify-center text-[13px] font-bold transition-all ${
                    s <= step ? "bg-blue-600 text-white" : "border border-gray-700 text-gray-600"
                  }`}>
                    {s < step ? "✓" : s}
                  </div>
                  {s < 2 && (
                    <div className={`h-px w-12 transition-all ${s < step ? "bg-blue-600/50" : "bg-gray-800"}`} />
                  )}
                </div>
              ))}
              <span className="ml-4 text-sm text-gray-600 font-mono">
                {step === 1 ? "conta admin" : "dados instituição"}
              </span>
            </div>

            {/* Eyebrow */}
            <div className="mb-5">
              <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-blue-500 mb-2">
                // registo de instituição
              </p>
              <h1 className="text-2xl font-bold text-gray-100">
                {step === 1 ? "Conta do administrador" : "Dados da instituição"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {step === 1
                  ? "Credenciais de acesso ao painel"
                  : "Informações sobre a sua organização"}
              </p>
            </div>

            {/* Perks — só no step 1 */}
            {step === 1 && (
              <div className="mb-5 space-y-2">
                {PERKS.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-b-0">
                    <Icon className="h-3.5 w-3.5 text-blue-500 shrink-0" strokeWidth={1.5} />
                    <div>
                      <span className="text-sm font-medium text-gray-300">{label}</span>
                      <span className="text-sm text-gray-600 ml-2">{sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 border border-red-500 bg-red-500/8 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="adminName" className="text-sm font-medium uppercase tracking-wider text-gray-500">Nome</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <input id="adminName" type="text" required autoComplete="name"
                      placeholder="João Silva" value={adminName} onChange={(e) => setAdminName(e.target.value)}
                      className={inputBase} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="adminEmail" className="text-sm font-medium uppercase tracking-wider text-gray-500">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <input id="adminEmail" type="email" required autoComplete="email"
                      placeholder="admin@instituicao.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                      className={inputBase} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="adminPassword" className="text-sm font-medium uppercase tracking-wider text-gray-500">Palavra-passe</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <input id="adminPassword" type={showPassword ? "text" : "password"} required
                      autoComplete="new-password" placeholder="min. 6 caracteres"
                      value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                      className={inputBase.replace("pr-3", "pr-10")} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit"
                  className="mt-2 flex w-full items-center justify-center gap-2 bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-all">
                  Continuar <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="instName" className="text-sm font-medium uppercase tracking-wider text-gray-500">Nome da instituição</label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <input id="instName" type="text" required disabled={loading}
                      placeholder="Escola Secundária de Luanda"
                      value={instName} onChange={(e) => setInstName(e.target.value)}
                      className={inputBase} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="instEmail" className="text-sm font-medium uppercase tracking-wider text-gray-500">Email da instituição</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <input id="instEmail" type="email" required disabled={loading}
                      placeholder="contacto@escola.ao"
                      value={instEmail} onChange={(e) => setInstEmail(e.target.value)}
                      className={inputBase} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="instPhone" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                    Telefone <span className="text-gray-700 normal-case tracking-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <input id="instPhone" type="tel" disabled={loading}
                      placeholder="+244 923 000 000"
                      value={instPhone} onChange={(e) => setInstPhone(e.target.value)}
                      className={inputBase} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="instAddress" className="text-sm font-medium uppercase tracking-wider text-gray-500">
                    Morada <span className="text-gray-700 normal-case tracking-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <input id="instAddress" type="text" disabled={loading}
                      placeholder="Rua da Escola, 123, Luanda"
                      value={instAddress} onChange={(e) => setInstAddress(e.target.value)}
                      className={inputBase} />
                  </div>
                </div>

                {/* Aviso aprovação */}
                <div className="flex items-start gap-2.5 border border-amber-500 bg-amber-500/5 px-3 py-2.5">
                  <span className="text-amber-400 text-sm mt-0.5">⚠</span>
                  <p className="text-sm text-amber-400 leading-relaxed">
                    Após o registo, a instituição ficará em <strong className="text-amber-400">avaliação</strong> até ser aprovada.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setStep(1); setError(""); }} disabled={loading}
                    className="flex items-center gap-1.5 border border-gray-800 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-700 transition-all disabled:opacity-50">
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60 transition-all">
                    {loading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <>Registar Instituição <ArrowRight className="h-3.5 w-3.5" /></>
                    }
                  </button>
                </div>
              </form>
            )}

            {/* Rodapé */}
            <div className="mt-8 space-y-3 border-t border-gray-800 pt-6">
              <p className="text-center text-sm text-gray-600">
                Já tem conta?{" "}
                <Link href="/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
                  Entrar agora
                </Link>
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-700">
                <Link href="/register" className="hover:text-gray-500 transition-colors">Sou aluno</Link>
                <span>·</span>
                <Link href="/register/teacher" className="hover:text-gray-500 transition-colors">Sou professor</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
