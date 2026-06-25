"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, Sun, Moon, Home, Phone, Globe, MapPin, Calendar } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, type AuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";
import { GoogleIcon, GithubIcon } from "@/components/ui/AuthIcons";

const carouselSlides = [
  {
    id: 1,
    image: "https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Cursos de programação",
    desc: "Aprenda a programar do zero ao avançado com projectos práticos e mentoria ao vivo.",
  },
  {
    id: 2,
    image: "https://images.pexels.com/photos/4143800/pexels-photo-4143800.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Aulas ao vivo",
    desc: "Participe de aulas em tempo real com instrutores experientes e tire dúvidas na hora.",
  },
  {
    id: 3,
    image: "https://images.pexels.com/photos/6953925/pexels-photo-6953925.jpeg?auto=compress&cs=tinysrgb&w=1600",
    title: "Comunidade de alunos",
    desc: "Conecte-se com outros estudantes, troque conhecimento e cresça junto com a comunidade.",
  }
];

export default function RegisterPage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [morada, setMorada] = useState("");
  const [idade, setIdade] = useState("");
  const [genero, setGenero] = useState("");
  const [nacionalidade, setNacionalidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pais, setPais] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [failedSlides, setFailedSlides] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  useEffect(() => {
    const saved = localStorage.getItem("public-theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let interval: ReturnType<typeof setInterval>;
      const start = () => { interval = setInterval(() => setSlideIndex((prev) => (prev + 1) % carouselSlides.length), 5000); };
      const stop = () => clearInterval(interval);
      start();
      const onVisibility = () => document.hidden ? stop() : start();
      document.addEventListener("visibilitychange", onVisibility);
      return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
    }
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("redirect");
    if (r && r.startsWith("/") && !r.startsWith("//") && !r.includes("://")) setRedirectTo(r);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("O nome é obrigatório."); return; }
    if (/\d/.test(name)) { setError("O nome não pode conter números."); return; }
    if (password !== confirmPassword) { setError("As palavras-passe não coincidem."); return; }
    if (!morada.trim()) { setError("A morada é obrigatória."); return; }
    if (!idade.trim() || isNaN(Number(idade)) || Number(idade) < 1 || Number(idade) > 150) { setError("Indique uma idade válida."); return; }
    if (!genero) { setError("Selecione o género."); return; }
    if (!nacionalidade.trim()) { setError("A nacionalidade é obrigatória."); return; }
    if (!telefone.trim()) { setError("O número de telefone é obrigatório."); return; }
    if (!pais.trim()) { setError("O país é obrigatório."); return; }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(userCredential.user, { displayName: name });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        name,
        role: "aluno",
        createdAt: new Date(),
        morada,
        idade: Number(idade),
        genero,
        nacionalidade,
        telefone,
        pais,
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

  const handleProviderRegister = async (provider: AuthProvider, providerName: string) => {
    setError("");
    if (!name.trim()) { setError("O nome é obrigatório."); return; }
    if (/\d/.test(name)) { setError("O nome não pode conter números."); return; }
    if (!morada.trim()) { setError("A morada é obrigatória."); return; }
    if (!idade.trim() || isNaN(Number(idade)) || Number(idade) < 1 || Number(idade) > 150) { setError("Indique uma idade válida."); return; }
    if (!genero) { setError("Selecione o género."); return; }
    if (!nacionalidade.trim()) { setError("A nacionalidade é obrigatória."); return; }
    if (!telefone.trim()) { setError("O número de telefone é obrigatório."); return; }
    if (!pais.trim()) { setError("O país é obrigatório."); return; }
    setProviderLoading(providerName);
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: userCredential.user.email || email,
          name: name || userCredential.user.displayName,
          role: "aluno",
          createdAt: new Date(),
          morada,
          idade: Number(idade),
          genero,
          nacionalidade,
          telefone,
          pais,
        });
      }
      router.push(redirectTo);
    } catch (err: unknown) {
        const code = (err as { code?: string })?.code || "";
        if (code === "auth/popup-closed-by-user") { setProviderLoading(null); return; }
        setError(code === "auth/popup-blocked"
          ? "Popup bloqueado pelo navegador. Permita popups e tente novamente."
          : `Falha ao registar com ${providerName}.`);
    } finally {
      setProviderLoading(null);
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-950 flex-col lg:flex-row overflow-hidden">
      {/* Left carousel */}
      <div className="relative hidden w-1/2 lg:flex flex-col items-center justify-center bg-gray-900 overflow-hidden">
        {carouselSlides.map((slide, i) => (
          <div key={slide.id} className={`absolute inset-0 z-0 transition-opacity duration-700 ${i === slideIndex ? "opacity-100" : "opacity-0"}`}>
            {failedSlides.has(i) ? (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
            ) : (
              <img src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover"
                onError={() => setFailedSlides(prev => new Set(prev).add(i))} />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-gray-950/20 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent z-10 pointer-events-none" />
        <Link href="/" className="absolute left-10 top-10 z-20 flex items-center gap-4 hover:opacity-80 transition-opacity">
          <img src="/Logo-Academy-White.svg" alt="Academy Logo" className="h-12 w-auto" />
          <span className="text-3xl font-light text-white/30">|</span>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Netsulwel" className="h-7 w-auto brightness-0 invert" />
            <span className="text-2xl font-bold text-white">Netsulwel</span>
          </div>
        </Link>
        <div className="absolute bottom-16 left-10 right-10 z-20">
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-xl transition-all duration-500">
            {carouselSlides[slideIndex].title}
          </h2>
          <p className="mt-4 text-lg text-gray-200 drop-shadow-md max-w-lg transition-all duration-500">
            {carouselSlides[slideIndex].desc}
          </p>
          <div className="mt-8 flex gap-3">
            {carouselSlides.map((_, i) => (
              <div key={i} className={`h-1.5 transition-all duration-300 ${i === slideIndex ? "w-8 bg-white" : "w-2 bg-white/40"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Register form */}
      <div data-theme={theme} className="relative flex w-full flex-col lg:w-1/2 bg-gray-950 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-10" />
        <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[600px] w-[600px] bg-purple/10 blur-[150px] hidden sm:block" />

        <div className="flex items-center justify-between p-6 z-20">
          <Link href="/" className="flex lg:hidden items-center gap-3">
            <img src="/Logo-Academy-White.svg" alt="Academy Logo" className="h-10 w-auto" />
            <img src="/logo.svg" alt="Netsulwel" className="h-6 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={togglePublicTheme} className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all text-gray-400 hover:text-white">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/login" className="text-sm font-medium text-white px-6 py-2.5 border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all">
              Iniciar sessão
            </Link>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-16 lg:px-24 z-20 pb-12 lg:pb-0">
          <div className="w-full max-w-md mx-auto transition-all duration-300">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-8 lg:mt-0">Comece a sua jornada.</h2>
            <p className="mt-2 text-sm text-gray-400 mb-8">Crie uma conta gratuita em poucos segundos</p>

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
                  <label className="text-sm font-medium text-gray-300" htmlFor="name">Nome completo</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <input id="name" type="text" required disabled={loading} placeholder="João Silva"
                      value={name} onChange={(e) => setName(e.target.value)}
                      className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300" htmlFor="email">Seu Email</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input id="email" type="email" required disabled={loading} placeholder="email@exemplo.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300" htmlFor="password">Palavra-passe</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input id="password" type={showPassword ? "text" : "password"} required disabled={loading}
                      placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-10 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
                    <button type="button" disabled={loading} onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 focus:outline-none disabled:opacity-50">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Mínimo de 6 caracteres</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300" htmlFor="confirmPassword">Confirmar palavra-passe</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} required disabled={loading}
                      placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-10 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
                    <button type="button" disabled={loading} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 focus:outline-none disabled:opacity-50">
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-5 mt-5">
                  <p className="text-sm font-medium text-gray-400 mb-4">Dados pessoais</p>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300" htmlFor="morada">Morada</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Home className="h-5 w-5 text-gray-500" />
                      </div>
                      <input id="morada" type="text" required disabled={loading} placeholder="Rua Principal, 123"
                        value={morada} onChange={(e) => setMorada(e.target.value)}
                        className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-300" htmlFor="idade">Idade</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Calendar className="h-5 w-5 text-gray-500" />
                        </div>
                        <input id="idade" type="number" required disabled={loading} placeholder="18" min="1" max="150"
                          value={idade} onChange={(e) => setIdade(e.target.value)}
                          className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-300" htmlFor="genero">Género</label>
                      <div className="relative">
                        <select id="genero" required disabled={loading}
                          value={genero} onChange={(e) => setGenero(e.target.value)}
                          className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-3 pr-3 text-white transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50 appearance-none">
                          <option value="" disabled>Selecionar</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-300" htmlFor="nacionalidade">Nacionalidade</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <MapPin className="h-5 w-5 text-gray-500" />
                        </div>
                        <input id="nacionalidade" type="text" required disabled={loading} placeholder="Angolana"
                          value={nacionalidade} onChange={(e) => setNacionalidade(e.target.value)}
                          className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-300" htmlFor="pais">País</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Globe className="h-5 w-5 text-gray-500" />
                        </div>
                        <input id="pais" type="text" required disabled={loading} placeholder="Angola"
                          value={pais} onChange={(e) => setPais(e.target.value)}
                          className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-4">
                    <label className="text-sm font-medium text-gray-300" htmlFor="telefone">Número de telefone</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Phone className="h-5 w-5 text-gray-500" />
                      </div>
                      <input id="telefone" type="tel" required disabled={loading} placeholder="+244 900 000 000"
                        value={telefone} onChange={(e) => setTelefone(e.target.value)}
                        className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="group glow-purple mt-6 flex w-full items-center justify-center gap-2 bg-white py-3.5 text-sm font-bold text-gray-950 transition-all hover:bg-gray-200 disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-gray-950" /> : "Criar Conta Grátis"}
                </button>
              </form>

              <div className="animate-in fade-in duration-500">
                <div className="mt-8 mb-6 flex items-center relative z-10">
                  <div className="w-full border-t border-gray-800"></div>
                  <div className="px-4 text-xs font-medium text-gray-500 whitespace-nowrap">Ou com Google / GitHub</div>
                  <div className="w-full border-t border-gray-800"></div>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <button type="button" disabled={!!providerLoading}
                    onClick={() => handleProviderRegister(new GoogleAuthProvider(), "Google")}
                    className="flex w-full items-center justify-center gap-2 border border-gray-700 bg-gray-950/50 py-2.5 text-sm font-semibold text-white transition-all hover:border-gray-500 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                    {providerLoading === "Google" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon className="h-5 w-5" />} Google
                  </button>
                  <button type="button" disabled={!!providerLoading}
                    onClick={() => handleProviderRegister(new GithubAuthProvider(), "GitHub")}
                    className="flex w-full items-center justify-center gap-2 border border-gray-700 bg-gray-950/50 py-2.5 text-sm font-semibold text-white transition-all hover:border-gray-500 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                    {providerLoading === "GitHub" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GithubIcon className="h-5 w-5" />} GitHub
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-gray-400 relative z-20">
              Já tem uma conta? <Link href="/login" className="font-semibold text-purple-light hover:text-purple transition-colors">Iniciar sessão</Link>
            </p>
            <p className="mt-2 text-center text-sm relative z-20">
              <Link href="/login?view=forgot" className="text-gray-500 hover:text-gray-300 transition-colors">Esqueceu a palavra-passe?</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
