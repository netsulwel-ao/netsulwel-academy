"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, Sun, Moon, Home, Phone, Globe, MapPin, Calendar, Building2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, setPersistence, browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail, type AuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";
import { GoogleIcon, GithubIcon } from "@/components/ui/AuthIcons";
import RegisterForm from "@/components/auth/RegisterForm";
import InstitutionForm from "@/components/auth/InstitutionForm";
import AuthForm from "@/components/AuthForm";
import SocialLogin from "@/components/SocialLogin";
import LoginCarousel from "@/components/LoginCarousel";
import LoginHeader from "@/components/LoginHeader";
import LoginFooter from "@/components/LoginFooter";

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
  const [view, setView] = useState<"login" | "register" | "register-institution" | "forgot">("login");
  
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
  const [rememberMe, setRememberMe] = useState(true);
 
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [failedSlides, setFailedSlides] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [redirectTo, setRedirectTo] = useState("/dashboard");
  const router = useRouter();

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
    const v = params.get("view");
    if (v === "forgot" || v === "register" || v === "register-institution") setView(v);
  }, []);

  // Mudar de vista sem limpar o email (útil se o utilizador já o preencheu)
  const toggleView = (newView: "login" | "register" | "register-institution" | "forgot") => {
  setView(newView);
  setError("");
  setSuccessMsg("");
  setPassword("");
  setConfirmPassword("");
  setMorada("");
  setIdade("");
  setGenero("");
  setNacionalidade("");
  setTelefone("");
  setPais("");
  };

 const handleAuthSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");
 setSuccessMsg("");
 setLoading(true);

 try {
  if (view === "login") {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
  const role = userDoc.exists() ? userDoc.data().role : "aluno";

  if (role === "admin" || role === "teacher") {
    router.push(redirectTo === "/dashboard" ? "/admin" : redirectTo);
  } else {
    router.push(redirectTo);
  }
 
  } else if (view === "register") {
  if (!name.trim()) { setError("O nome é obrigatório."); setLoading(false); return; }
  if (/\d/.test(name)) { setError("O nome não pode conter números."); setLoading(false); return; }
  if (password !== confirmPassword) { setError("As palavras-passe não coincidem."); setLoading(false); return; }
  if (!morada.trim()) { setError("A morada é obrigatória."); setLoading(false); return; }
  if (!idade.trim() || isNaN(Number(idade)) || Number(idade) < 1 || Number(idade) > 150) { setError("Indique uma idade válida."); setLoading(false); return; }
  if (!genero) { setError("Selecione o género."); setLoading(false); return; }
  if (!nacionalidade.trim()) { setError("A nacionalidade é obrigatória."); setLoading(false); return; }
  if (!telefone.trim()) { setError("O número de telefone é obrigatório."); setLoading(false); return; }
  if (!pais.trim()) { setError("O país é obrigatório."); setLoading(false); return; }

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
      } else if (view === "register-institution") {
	  if (!name.trim()) { setError("O nome da instituição é obrigatório."); setLoading(false); return; }

	  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
	  if (name) {
	  await updateProfile(userCredential.user, { displayName: name });
	  }

	  // Regista o utilizador como "institution" (instituição será criada no passo seguinte)
	  await setDoc(doc(db, "users", userCredential.user.uid), {
	  email: email,
	  name: name,
	  role: "institution",
	  createdAt: new Date(),
	  });

	  await sendEmailVerification(userCredential.user);
	  router.push("/register/institution");

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
  const code = (err as { code?: string })?.code || "";
  if (view === "forgot") {
  const msg = err instanceof Error ? err.message : "Não foi possível enviar o email. Verifique se o endereço está correto.";
  setError(msg);
  } else if (view === "register") {
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Este email já está registado. Tente fazer login.",
    "auth/weak-password": "A palavra-passe deve ter pelo menos 6 caracteres.",
    "auth/invalid-email": "O formato do email é inválido.",
    "auth/too-many-requests": "Muitas tentativas. Espere alguns minutos e tente novamente.",
  };
  setError(messages[code] || "Erro ao criar conta. Tente novamente.");
  } else {
  const messages: Record<string, string> = {
    "auth/invalid-email": "O formato do email é inválido.",
    "auth/user-disabled": "Esta conta foi desactivada.",
    "auth/user-not-found": "Não existe conta com este email.",
    "auth/wrong-password": "Senha incorrecta.",
    "auth/invalid-credential": "Email ou senha incorrectos.",
    "auth/too-many-requests": "Muitas tentativas. Espere alguns minutos e tente novamente.",
  };
  setError(messages[code] || "Erro ao fazer login. Tente novamente.");
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

  if (view === "register") {
    if (!name.trim()) { setError("O nome é obrigatório."); return; }
    if (/\d/.test(name)) { setError("O nome não pode conter números."); return; }
    if (!morada.trim()) { setError("A morada é obrigatória."); return; }
    if (!idade.trim() || isNaN(Number(idade)) || Number(idade) < 1 || Number(idade) > 150) { setError("Indique uma idade válida."); return; }
    if (!genero) { setError("Selecione o género."); return; }
    if (!nacionalidade.trim()) { setError("A nacionalidade é obrigatória."); return; }
    if (!telefone.trim()) { setError("O número de telefone é obrigatório."); return; }
    if (!pais.trim()) { setError("O país é obrigatório."); return; }
  }

  setProviderLoading(providerName);

  try {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  const userCredential = await signInWithPopup(auth, provider);
  
  // Tenta ler o documento para ver se é admin. Se não existir, cria como "aluno"
  const userDocRef = doc(db, "users", userCredential.user.uid);
  const userDoc = await getDoc(userDocRef);
  
  if (!userDoc.exists()) {
  const isInstRegister = view === "register-institution";
  await setDoc(userDocRef, {
  email: userCredential.user.email,
  name: name || userCredential.user.displayName,
  role: isInstRegister ? "institution" : "aluno",
  createdAt: new Date(),
  ...(view === "register" && {
    morada,
    idade: Number(idade),
    genero,
    nacionalidade,
    telefone,
    pais,
  }),
  });
  router.push(isInstRegister ? "/register/institution" : redirectTo);
  } else {
  const role = userDoc.data().role;
  if (role === "admin" || role === "teacher") {
    router.push(redirectTo === "/dashboard" ? "/admin" : redirectTo);
  } else {
    router.push(redirectTo);
  }
  }
  
  } catch (err: unknown) {
  console.error(err);
  const code = (err as { code?: string })?.code || "";
  if (code === "auth/popup-closed-by-user") { setProviderLoading(null); return; }
  setError(code === "auth/popup-blocked"
    ? "Popup bloqueado pelo navegador. Permita popups e tente novamente."
    : `Falha ao iniciar sessão com ${providerName}.`);
  } finally {
  setProviderLoading(null);
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
  {failedSlides.has(i) ? (
  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
  ) : (
  <img 
  src={slide.image} 
  alt={slide.title} 
  className="absolute inset-0 h-full w-full object-cover" 
  onError={() => setFailedSlides(prev => new Set(prev).add(i))}
  />
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
   <div className="flex items-center gap-1.5 sm:gap-3">
   <button onClick={togglePublicTheme} className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all text-gray-400 hover:text-white">
   {theme === "dark" ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
   </button>
   {view === "login" ? (
   <>
   <button onClick={() => toggleView("register")} className="text-xs sm:text-sm font-medium text-white px-2.5 sm:px-4 py-2 border sm:py-2.5 border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all whitespace-nowrap">
   Criar conta
   </button>
   <button onClick={() => toggleView("register-institution")} className="text-xs sm:text-sm font-medium text-white px-2.5 sm:px-4 py-2 border sm:py-2.5 border-purple-800 bg-purple-900/60 backdrop-blur-md hover:bg-purple-800 hover:border-purple-600 transition-all whitespace-nowrap">
   Instituição
   </button>
   </>
   ) : (
   <button onClick={() => toggleView("login")} className="text-xs sm:text-sm font-medium text-white px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all whitespace-nowrap">
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
 {view === "register-institution" && "Registe a sua instituição"}
 {view === "forgot" && "Recuperar senha."}
 </h2>
 <p className="mt-2 text-sm text-gray-400 mb-8 transition-all">
 {view === "login" && "Inicie sessão na sua conta Netsulwel"}
 {view === "register" && "Crie uma conta gratuita em poucos segundos"}
 {view === "register-institution" && "Registe a sua instituição educacional"}
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
 <RegisterForm
 name={name}
 setName={setName}
 morada={morada}
 setMorada={setMorada}
 idade={idade}
 setIdade={setIdade}
 genero={genero}
 setGenero={setGenero}
 nacionalidade={nacionalidade}
 setNacionalidade={setNacionalidade}
 telefone={telefone}
 setTelefone={setTelefone}
 pais={pais}
 setPais={setPais}
 password={password}
 confirmPassword={confirmPassword}
 showPassword={showPassword}
 showConfirmPassword={showConfirmPassword}
 setShowPassword={setShowPassword}
 setShowConfirmPassword={setShowConfirmPassword}
 setPassword={setPassword}
 setConfirmPassword={setConfirmPassword}
 loading={loading}
 />
 )}

 {view === "register-institution" && (
 <InstitutionForm
 name={name}
 setName={setName}
 loading={loading}
 />
 )}

 {view !== "register" && (
 <AuthForm
 email={email}
 setEmail={setEmail}
 password={password}
 setPassword={setPassword}
 showPassword={showPassword}
 setShowPassword={setShowPassword}
 loading={loading}
 showPasswordField={view !== "forgot"}
 />
 )}

  {view === "login" && (
  <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
 <label className="flex items-center gap-2 cursor-pointer group">
 <div className="relative flex items-center">
  <input 
  type="checkbox"
  checked={rememberMe}
  onChange={(e) => setRememberMe(e.target.checked)}
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
 {view === "register-institution" && "Registar Instituição"}
 {view === "forgot" && "Enviar link de recuperação"}
 </>
 )}
 </button>
 </form>

 <SocialLogin
 loading={loading}
 handleSocialLogin={(provider) => handleProviderLogin(
 provider === "google" ? new GoogleAuthProvider() : new GithubAuthProvider(),
 provider === "google" ? "Google" : "GitHub"
 )}
 providerLoading={providerLoading}
 view={view}
 />
 </div>
 
 <LoginFooter view={view} toggleView={toggleView} />
 </div>
 </div>
 </div>
 </main>
 );
}
