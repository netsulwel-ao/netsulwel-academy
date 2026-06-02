"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, Sun, Moon, Home, Phone, Globe, MapPin, Calendar } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, type AuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

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
  const [morada, setMorada] = useState("");
  const [idade, setIdade] = useState("");
  const [genero, setGenero] = useState("");
  const [nacionalidade, setNacionalidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pais, setPais] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  useEffect(() => {
    const saved = localStorage.getItem("public-theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const interval = setInterval(() => {
        setSlideIndex((prev) => (prev + 1) % carouselSlides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("redirect");
    if (r) setRedirectTo(r);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("O nome é obrigatório."); return; }
    if (/\d/.test(name)) { setError("O nome não pode conter números."); return; }
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
      router.push(redirectTo);
    } catch {
      setError("Erro ao criar conta. A palavra-passe deve ter pelo menos 6 caracteres ou o email já está em uso.");
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
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: userCredential.user.email,
          name: userCredential.user.displayName,
          role: "aluno",
          createdAt: new Date(),
        });
      }
      router.push(redirectTo);
    } catch {
        setError(`Falha ao registar com ${providerName}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-950 flex-col lg:flex-row overflow-hidden">
      {/* Left carousel */}
      <div className="relative hidden w-1/2 lg:flex flex-col items-center justify-center bg-gray-900 overflow-hidden">
        {carouselSlides.map((slide, i) => (
          <div key={slide.id} className={`absolute inset-0 z-0 transition-opacity duration-700 ${i === slideIndex ? "opacity-100" : "opacity-0"}`}>
            <img src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" />
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

                  <div className="grid grid-cols-2 gap-3 mt-4">
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

                  <div className="grid grid-cols-2 gap-3 mt-4">
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
                  <button type="button" disabled={loading}
                    onClick={() => handleProviderRegister(new GoogleAuthProvider(), "Google")}
                    className="flex w-full items-center justify-center gap-2 border border-gray-700 bg-gray-950/50 py-2.5 text-sm font-semibold text-white transition-all hover:border-gray-500 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                    <GoogleIcon className="h-5 w-5" /> Google
                  </button>
                  <button type="button" disabled={loading}
                    onClick={() => handleProviderRegister(new GithubAuthProvider(), "GitHub")}
                    className="flex w-full items-center justify-center gap-2 border border-gray-700 bg-gray-950/50 py-2.5 text-sm font-semibold text-white transition-all hover:border-gray-500 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                    <GithubIcon className="h-5 w-5" /> GitHub
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-gray-400 relative z-20">
              Já tem uma conta? <Link href="/login" className="font-semibold text-purple-light hover:text-purple transition-colors">Iniciar sessão</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
