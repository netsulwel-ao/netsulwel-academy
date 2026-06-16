"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, Sun, Moon, BookOpen, MessageSquare } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function TeacherRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("public-theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("O nome é obrigatório."); return; }
    if (/\d/.test(name)) { setError("O nome não pode conter números."); return; }
    if (password !== confirmPassword) { setError("As palavras-passe não coincidem."); return; }
    if (!specialty.trim()) { setError("A especialidade é obrigatória."); return; }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(userCredential.user, { displayName: name });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        name,
        role: "teacher",
        status: "pending",
        specialty,
        bio: bio || "",
        createdAt: new Date(),
      });
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
      setError(messages[code] || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const togglePublicTheme = () => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("public-theme", next);
      return next;
    });
  };

  return (
    <main className="flex min-h-screen bg-gray-950 flex-col lg:flex-row overflow-hidden">
      {/* Left — decorative */}
      <div className="relative hidden w-1/2 lg:flex flex-col items-center justify-center bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-gray-900 to-gray-950" />
        <Link href="/" className="absolute left-10 top-10 z-20 flex items-center gap-4 hover:opacity-80 transition-opacity">
          <img src="/Logo-Academy-White.svg" alt="Academy Logo" className="h-12 w-auto" />
          <span className="text-3xl font-light text-white/30">|</span>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Netsulwel" className="h-7 w-auto brightness-0 invert" />
            <span className="text-2xl font-bold text-white">Netsulwel</span>
          </div>
        </Link>
        <div className="absolute bottom-16 left-10 right-10 z-20">
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">Torne-se professor</h2>
          <p className="mt-4 text-lg text-gray-300 max-w-lg">
            Crie cursos, dê aulas ao vivo, e partilhe o seu conhecimento com milhares de alunos.
          </p>
        </div>
      </div>

      {/* Right panel — Teacher Register form */}
      <div data-theme={theme} className="relative flex w-full flex-col lg:w-1/2 bg-gray-950 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-10" />
        <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[600px] w-[600px] bg-green/10 blur-[150px] hidden sm:block" />

        <div className="flex items-center justify-between p-6 z-20">
          <Link href="/" className="flex lg:hidden items-center gap-3">
            <img src="/Logo-Academy-White.svg" alt="Academy Logo" className="h-10 w-auto" />
            <img src="/logo.svg" alt="Netsulwel" className="h-6 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={togglePublicTheme} className="flex items-center justify-center h-9 w-9 border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all text-gray-400 hover:text-white">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/login" className="text-sm font-medium text-white px-6 py-2.5 border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all">
              Iniciar sessão
            </Link>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-16 lg:px-24 z-20 pb-12 lg:pb-0">
          <div className="w-full max-w-md mx-auto transition-all duration-300">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-8 lg:mt-0">Criar conta de professor</h2>
            <p className="mt-2 text-sm text-gray-400 mb-8">Registe-se para publicar cursos e dar aulas ao vivo</p>

            <div className="border border-gray-800/50 bg-gray-900/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />

              {error && (
                <div className="mb-6 flex items-center gap-2 bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 relative z-10 animate-in fade-in zoom-in duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form className="space-y-5 relative z-10" onSubmit={handleRegister}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300" htmlFor="teacher-name">Nome completo</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input id="teacher-name" type="text" required disabled={loading} placeholder="João Silva"
                      value={name} onChange={(e) => setName(e.target.value)}
                      className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-green focus:outline-none focus:ring-1 focus:ring-green disabled:opacity-50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300" htmlFor="teacher-email">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input id="teacher-email" type="email" required disabled={loading} placeholder="professor@exemplo.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-green focus:outline-none focus:ring-1 focus:ring-green disabled:opacity-50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300" htmlFor="teacher-password">Palavra-passe</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input id="teacher-password" type={showPassword ? "text" : "password"} required disabled={loading}
                        placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-10 text-white placeholder-gray-600 transition-colors focus:border-green focus:outline-none focus:ring-1 focus:ring-green disabled:opacity-50" />
                      <button type="button" disabled={loading} onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 focus:outline-none disabled:opacity-50">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300" htmlFor="teacher-confirmPassword">Confirmar</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input id="teacher-confirmPassword" type={showConfirmPassword ? "text" : "password"} required disabled={loading}
                        placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-10 text-white placeholder-gray-600 transition-colors focus:border-green focus:outline-none focus:ring-1 focus:ring-green disabled:opacity-50" />
                      <button type="button" disabled={loading} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 focus:outline-none disabled:opacity-50">
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300" htmlFor="teacher-specialty">Especialidade</label>
                  <div className="relative">
                    <BookOpen className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input id="teacher-specialty" type="text" required disabled={loading}
                      placeholder="Ex: Programação Web, Finanças, Matemática"
                      value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                      className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-green focus:outline-none focus:ring-1 focus:ring-green disabled:opacity-50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300" htmlFor="teacher-bio">Biografia curta</label>
                  <div className="relative">
                    <MessageSquare className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-500" />
                    <textarea id="teacher-bio" rows={3} disabled={loading} placeholder="Conte um pouco sobre a sua experiência e formação..."
                      value={bio} onChange={(e) => setBio(e.target.value)}
                      className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-green focus:outline-none focus:ring-1 focus:ring-green disabled:opacity-50 resize-none" />
                  </div>
                </div>

                <div className="p-3 bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-xs text-yellow-400">
                    Após o registo, a sua conta ficará em estado <strong>pendente</strong> até ser aprovada pela administração. Receberá um email quando for aprovada.
                  </p>
                </div>

                <button type="submit" disabled={loading}
                  className="group mt-6 flex w-full items-center justify-center gap-2 bg-green py-3.5 text-sm font-bold text-white transition-all hover:bg-green/80 disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar conta de professor"}
                </button>
              </form>
            </div>

            <p className="mt-8 text-center text-sm text-gray-400 relative z-20">
              Já tem conta? <Link href="/login" className="font-semibold text-green-400 hover:text-green-300 transition-colors">Iniciar sessão</Link>
            </p>
            <p className="mt-2 text-center text-sm relative z-20">
              <Link href="/register" className="text-gray-500 hover:text-gray-300 transition-colors">Quero registar-me como aluno</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}