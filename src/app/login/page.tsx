"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, Sun, Moon } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
 signInWithPopup,
 GoogleAuthProvider,
 GithubAuthProvider,
} from "firebase/auth";
import { useRouter } from "next/navigation";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
 return (
 <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
 <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
 </svg>
 );
}

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

export default function LoginPage() {
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
  const [slideIndex, setSlideIndex] = useState(0);
  
  const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  // Mudar de vista sem limpar o email (útil se o utilizador já o preencheu)
 const toggleView = (newView: "login" | "register" | "forgot") => {
 setView(newView);
 setError("");
 setSuccessMsg("");
 setPassword(""); // Limpar sempre a senha por segurança
 };

 const handleAuthSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");
 setSuccessMsg("");
 setLoading(true);

 try {
 if (view === "login") {
 const userCredential = await signInWithEmailAndPassword(auth, email, password);
 const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
 
  if (userDoc.exists() && userDoc.data().role === "admin") {
 router.push("/admin");
 } else {
 router.push("/dashboard");
 }
 
 } else if (view === "register") {
 const userCredential = await createUserWithEmailAndPassword(auth, email, password);
 if (name) {
 // Atualiza o perfil na Firebase Auth
 await updateProfile(userCredential.user, { displayName: name });
 }
 
 // Regista o utilizador na coleção users como "aluno" por defeito
 await setDoc(doc(db, "users", userCredential.user.uid), {
 email: email,
 name: name,
 role: "aluno",
 createdAt: new Date()
 });

  router.push("/dashboard");
 
  } else if (view === "forgot") {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.ok) {
    setSuccessMsg("Email de recuperação enviado! Verifique a sua caixa de entrada e a pasta de spam.");
  } else if (res.status === 404) {
    setError("Email inexistente. Verifique se o endereço está correto.");
  } else {
    const errMsg = data?.error || "Erro ao enviar email de recuperação.";
    setError(data?.detail ? `${errMsg} (${data.detail})` : errMsg);
  }
  }
  } catch (err: unknown) {
  console.error(err);
  if (view === "forgot") {
  const msg = err instanceof Error ? err.message : "Não foi possível enviar o email. Verifique se o endereço está correto.";
  setError(msg);
  } else if (view === "register") {
 setError("Erro ao criar conta. A palavra-passe deve ter pelo menos 6 caracteres ou o email já está em uso.");
 } else {
 setError("Credenciais inválidas. Verifique o seu email e senha.");
 }
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

  const handleProviderLogin = async (provider: Parameters<typeof signInWithPopup>[1], providerName: string) => {
 setError("");
 setLoading(true);

 try {
 const userCredential = await signInWithPopup(auth, provider);
 
 // Tenta ler o documento para ver se é admin. Se não existir, cria como "aluno"
 const userDocRef = doc(db, "users", userCredential.user.uid);
 const userDoc = await getDoc(userDocRef);
 
 if (!userDoc.exists()) {
 await setDoc(userDocRef, {
 email: userCredential.user.email,
 name: userCredential.user.displayName,
 role: "aluno",
 createdAt: new Date()
 });
 router.push("/dashboard");
 } else if (userDoc.data().role === "admin") {
 router.push("/admin");
 } else {
 router.push("/dashboard");
 }
 
  } catch (err: unknown) {
 console.error(err);
 setError(`Falha ao iniciar sessão com ${providerName}.`);
 } finally {
 setLoading(false);
 }
 };

 return (
  <main className="flex min-h-screen bg-gray-950 flex-col lg:flex-row overflow-hidden">
 
 {/* 
 ------------------------------------------
 PAINEL ESQUERDO: CARROSSEL DE IMAGENS
 (Oculto em mobile, visível a partir de lg)
 ------------------------------------------
 */}
  <div className="relative hidden w-1/2 lg:flex flex-col items-center justify-center bg-gray-900 overflow-hidden">
  {carouselSlides.map((slide, i) => (
  <div key={slide.id} className={`absolute inset-0 z-0 transition-opacity duration-700 ${i === slideIndex ? "opacity-100" : "opacity-0"}`}>
  <img 
  src={slide.image} 
  alt={slide.title} 
  className="absolute inset-0 h-full w-full object-cover" 
  />
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

 {/* 
 ------------------------------------------
 PAINEL DIREITO: FORMULÁRIO GLASSMORPHISM
 ------------------------------------------
 */}
  <div data-theme={theme} className="relative flex w-full flex-col lg:w-1/2 bg-gray-950 overflow-hidden">
  
  <div className="pointer-events-none absolute inset-0 grid-bg opacity-10" />
   <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[600px] w-[600px] bg-purple/10 blur-[150px] hidden sm:block" />

  <div className="flex items-center justify-between p-6 z-20">
  <div className="flex items-center gap-2">
  <Link href="/" className="flex lg:hidden items-center gap-3">
  <img src="/Logo-Academy-White.svg" alt="Academy Logo" className="h-10 w-auto" />
  <img src="/logo.svg" alt="Netsulwel" className="h-6 w-auto brightness-0 invert" />
  </Link>
  </div>
  <div className="flex items-center gap-3">
  <button onClick={togglePublicTheme} className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all text-gray-400 hover:text-white">
  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
  </button>
  {view === "login" ? (
  <button onClick={() => toggleView("register")} className="text-sm font-medium text-white px-6 py-2.5 border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all">
  Criar conta
  </button>
  ) : (
  <button onClick={() => toggleView("login")} className="text-sm font-medium text-white px-6 py-2.5 border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all">
  Iniciar sessão
  </button>
  )}
  </div>
  </div>

 <div className="flex-1 flex flex-col justify-center px-6 sm:px-16 lg:px-24 z-20 pb-12 lg:pb-0">
 <div className="w-full max-w-md mx-auto transition-all duration-300">
 
 <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-8 lg:mt-0 transition-all">
 {view === "login" && "Bem-vindo de volta!"}
 {view === "register" && "Comece a sua jornada."}
 {view === "forgot" && "Recuperar senha."}
 </h2>
 <p className="mt-2 text-sm text-gray-400 mb-8 transition-all">
 {view === "login" && "Inicie sessão na sua conta Netsulwel"}
 {view === "register" && "Crie uma conta gratuita em poucos segundos"}
 {view === "forgot" && "Insira o seu email para receber um link de recuperação"}
 </p>

  <div className=" border border-gray-800/50 bg-gray-900/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
 <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none"></div>

 {error && (
 <div className="mb-6 flex items-center gap-2 bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 relative z-10 animate-in fade-in zoom-in duration-200">
 <AlertCircle className="h-4 w-4 shrink-0" />
 <p>{error}</p>
 </div>
 )}

 {successMsg && (
 <div className="mb-6 flex items-center gap-2 bg-green-500/10 p-4 text-sm text-green-400 border border-green-500/20 relative z-10 animate-in fade-in zoom-in duration-200">
 <CheckCircle2 className="h-4 w-4 shrink-0" />
 <p>{successMsg}</p>
 </div>
 )}

 <form className="space-y-5 relative z-10" onSubmit={handleAuthSubmit}>
 
 {view === "register" && (
 <div className="space-y-1.5 animate-in slide-in-from-top-4 fade-in duration-300">
 <label className="text-sm font-medium text-gray-300" htmlFor="name">Nome completo</label>
 <div className="relative">
 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
 <User className="h-5 w-5 text-gray-500" />
 </div>
 <input
 id="name"
 type="text"
 required={view === "register"}
 disabled={loading}
 placeholder="João Silva"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50"
 />
 </div>
 </div>
 )}

 <div className="space-y-1.5">
 <label className="text-sm font-medium text-gray-300" htmlFor="email">Seu Email</label>
 <div className="relative">
 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
 <Mail className="h-5 w-5 text-gray-500" />
 </div>
 <input
 id="email"
 type="email"
 required
 disabled={loading}
 placeholder="email@exemplo.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50"
 />
 </div>
 </div>

 {view !== "forgot" && (
 <div className="space-y-1.5 animate-in slide-in-from-bottom-2 fade-in duration-300">
 <label className="text-sm font-medium text-gray-300" htmlFor="password">Palavra-passe</label>
 <div className="relative">
 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
 <Lock className="h-5 w-5 text-gray-500" />
 </div>
 <input
 id="password"
 type={showPassword ? "text" : "password"}
 required
 disabled={loading}
 placeholder="••••••••"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="block w-full border border-gray-700 bg-gray-950/50 py-3 pl-10 pr-10 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50"
 />
 <button
 type="button"
 disabled={loading}
 onClick={() => setShowPassword(!showPassword)}
 className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 focus:outline-none disabled:opacity-50"
 >
 {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
 </button>
 </div>
 </div>
 )}

 {view === "login" && (
 <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
 <label className="flex items-center gap-2 cursor-pointer group">
 <div className="relative flex items-center">
 <input 
 type="checkbox" 
 disabled={loading}
 className="peer h-4 w-4 shrink-0 border-gray-700 bg-gray-950/50 text-purple focus:ring-purple focus:ring-offset-gray-900 disabled:opacity-50 transition-colors cursor-pointer" 
 />
 </div>
 <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Lembrar-me</span>
 </label>
 <button type="button" onClick={() => toggleView("forgot")} className="text-sm font-medium text-gray-400 hover:text-purple-light transition-colors">
 Esqueceu a senha?
 </button>
 </div>
 )}

 <button
 type="submit"
 disabled={loading || (view === "forgot" && successMsg !== "")}
 className="group glow-purple mt-6 flex w-full items-center justify-center gap-2 bg-white py-3.5 text-sm font-bold text-gray-950 transition-all hover:bg-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
 >
 {loading ? (
 <Loader2 className="h-5 w-5 animate-spin text-gray-950" />
 ) : (
 <>
 {view === "login" && "Entrar"}
 {view === "register" && "Criar Conta Grátis"}
 {view === "forgot" && "Enviar link de recuperação"}
 </>
 )}
 </button>
 </form>

 {view !== "forgot" && (
 <div className="animate-in fade-in duration-500">
 <div className="mt-8 mb-6 flex items-center relative z-10">
 <div className="w-full border-t border-gray-800"></div>
 <div className="px-4 text-xs font-medium text-gray-500 whitespace-nowrap">Ou com Google / GitHub</div>
 <div className="w-full border-t border-gray-800"></div>
 </div>

 <div className="grid grid-cols-2 gap-3 relative z-10">
 <button
 type="button"
 disabled={loading}
 onClick={() => handleProviderLogin(new GoogleAuthProvider(), "Google")}
 className="flex w-full items-center justify-center gap-2 border border-gray-700 bg-gray-950/50 py-2.5 text-sm font-semibold text-white transition-all hover:border-gray-500 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <GoogleIcon className="h-5 w-5" />
 Google
 </button>
 <button
 type="button"
 disabled={loading}
 onClick={() => handleProviderLogin(new GithubAuthProvider(), "GitHub")}
 className="flex w-full items-center justify-center gap-2 border border-gray-700 bg-gray-950/50 py-2.5 text-sm font-semibold text-white transition-all hover:border-gray-500 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <GithubIcon className="h-5 w-5" />
 GitHub
 </button>
 </div>
 </div>
 )}
 </div>
 
 <p className="mt-8 text-center text-sm text-gray-400 relative z-20">
 {view === "login" && (
 <>Não tem nenhuma conta? <button onClick={() => toggleView("register")} className="font-semibold text-purple-light hover:text-purple transition-colors">Registar agora</button></>
 )}
 {view === "register" && (
 <>Já tem uma conta? <button onClick={() => toggleView("login")} className="font-semibold text-purple-light hover:text-purple transition-colors">Iniciar sessão</button></>
 )}
 {view === "forgot" && (
 <>Lembrou-se da senha? <button onClick={() => toggleView("login")} className="font-semibold text-purple-light hover:text-purple transition-colors">Voltar ao Login</button></>
 )}
 </p>
 </div>
 </div>
 </div>
 </main>
 );
}
