"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import SocialLogin from "@/components/SocialLogin";

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
  const [slideIndex, setSlideIndex] = useState(0);
  const [view, setView] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [failedSlides, setFailedSlides] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);
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
    if (v === "forgot") setView("forgot");
  }, []);

  const toggleView = (newView: "login" | "forgot") => {
    setView(newView);
    setError("");
    setSuccessMsg("");
    setPassword("");
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

        if (role === "admin") {
          router.push(redirectTo === "/dashboard" ? "/admin" : redirectTo);
        } else if (role === "teacher") {
          router.push(redirectTo === "/dashboard" ? "/dashboard/teacher" : redirectTo);
        } else if (role === "institution") {
          router.push(redirectTo === "/dashboard" ? "/dashboard/institution" : redirectTo);
        } else {
          router.push(redirectTo);
        }
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
          setError(data?.error || "Erro ao enviar email de recuperação.");
        }
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (view === "forgot") {
        setError(err instanceof Error ? err.message : "Não foi possível enviar o email.");
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

  const handleSocialLogin = async (provider: "google" | "github") => {
    setError("");
    setLoading(true);
    setProviderLoading(provider === "google" ? "Google" : "GitHub");

    try {
      let authProvider;
      if (provider === "google") {
        authProvider = new GoogleAuthProvider();
      } else {
        authProvider = new GithubAuthProvider();
      }
      const result = await signInWithPopup(auth, authProvider);
      const userDoc = await getDoc(doc(db, "users", result.user.uid));

      if (!userDoc.exists()) {
        router.push("/register");
        return;
      }

      const role = userDoc.data().role;
      if (role === "admin") {
        router.push(redirectTo === "/dashboard" ? "/admin" : redirectTo);
      } else if (role === "teacher") {
        router.push(redirectTo === "/dashboard" ? "/dashboard/teacher" : redirectTo);
      } else if (role === "institution") {
        router.push(redirectTo === "/dashboard" ? "/dashboard/institution" : redirectTo);
      } else {
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError("");
      } else if (code === "auth/account-exists-with-different-credential") {
        setError("Já existe uma conta com este email. Tente outro método de login.");
      } else {
        setError("Erro ao autenticar com " + provider + ". Tente novamente.");
      }
    } finally {
      setLoading(false);
      setProviderLoading(null);
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
    <main className={`flex min-h-screen ${theme === "dark" ? "bg-gray-950" : "bg-[#FAFAFA]"}`}>
      {/* LEFT — Form */}
      <div className={`flex w-full lg:w-[45%] flex-col relative overflow-hidden ${theme === "dark" ? "bg-gray-950" : "bg-[#FAFAFA]"}`}>
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-10" />

        <div className="flex items-center justify-between px-6 sm:px-10 pt-6 pb-2 z-20">
          <Link href="/" className="flex items-center gap-3">
            {theme === "dark" ? (
              <>
                <img src="/Logo-Academy-White.svg" alt="Academy" className="h-10 w-auto" />
                <img src="/logo.svg" alt="Netsulwel" className="h-6 w-auto brightness-0 invert" />
              </>
            ) : (
              <>
                <img src="/Logo-Academy-White.svg" alt="Academy" className="h-10 w-auto brightness-0" />
                <img src="/logo.svg" alt="Netsulwel" className="h-6 w-auto" />
              </>
            )}
          </Link>
          <button onClick={togglePublicTheme}
            className={`flex items-center justify-center h-8 w-8 border transition-all ${
              theme === "dark"
                ? "border-gray-800 bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-white"
                : "border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700"
            }`}>
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 z-20 pb-6">
          <div className="w-full max-w-sm mx-auto">

            {/* Title — directly above the card */}
            <div className="mb-6">
              <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {view === "login" ? "Bem-vindo de volta!" : "Recuperar senha"}
              </h2>
              <p className={`mt-1 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                {view === "login"
                  ? "Inicie sessão na sua conta Netsulwel"
                  : "Insira o seu email para receber um link de recuperação"}
              </p>
            </div>

            <div className={`login-card border p-6 sm:p-8 relative ${
              theme === "dark"
                ? "bg-gray-900/40"
                : "bg-white border-gray-200"
            }`}>
              <div className={`absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none login-card-glow ${theme === "dark" ? "opacity-50" : "opacity-0"}`} />

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
                <div className="space-y-1.5">
                  <label className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`} htmlFor="login-email">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input id="login-email" type="email" required disabled={loading}
                      placeholder="seu@email.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      className={`block w-full border py-3 pl-10 pr-3 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50 ${
                        theme === "dark"
                          ? "border-gray-700 bg-gray-950/50 text-white placeholder-gray-600"
                          : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                      }`} />
                  </div>
                </div>

                {view === "login" && (
                  <div className="space-y-1.5">
                    <label className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`} htmlFor="login-password">Palavra-passe</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input id="login-password" type={showPassword ? "text" : "password"} required disabled={loading}
                        placeholder="••••••••"
                        value={password} onChange={e => setPassword(e.target.value)}
                        className={`block w-full border py-3 pl-10 pr-10 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple disabled:opacity-50 ${
                          theme === "dark"
                            ? "border-gray-700 bg-gray-950/50 text-white placeholder-gray-600"
                            : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                        }`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                          theme === "dark" ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                        }`}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {view === "login" && (
                  <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)} disabled={loading}
                        className="h-4 w-4 shrink-0 text-purple focus:ring-purple disabled:opacity-50 cursor-pointer"
                        style={{ accentColor: "#7c3aed" }} />
                      <span className={`text-sm font-medium transition-colors ${theme === "dark" ? "text-gray-400 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-700"}`}>Lembrar-me</span>
                    </label>
                    <button type="button" onClick={() => toggleView("forgot")}
                      className="text-sm font-medium text-gray-400 hover:text-purple-light transition-colors">
                      Esqueceu a senha?
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading || (view === "forgot" && successMsg !== "")}
                  className="mt-6 flex w-full items-center justify-center gap-2 bg-purple hover:bg-purple-light text-white py-3.5 text-sm font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" />
                    : view === "login" ? "Entrar" : "Enviar link de recuperação"}
                </button>

                {view === "login" && (
                  <SocialLogin
                    loading={loading}
                    handleSocialLogin={handleSocialLogin}
                    providerLoading={providerLoading}
                    view={view}
                  />
                )}
              </form>

              {view === "forgot" && (
                <button type="button" onClick={() => toggleView("login")}
                  className="mt-4 text-sm text-gray-400 hover:text-purple-light transition-colors text-center w-full">
                  Voltar ao login
                </button>
              )}
            </div>

            <div className={`mt-8 text-center space-y-2 ${theme === "dark" ? "login-register-text" : "text-gray-500"}`}>
              <p className="text-sm">
                Ainda não tem conta?{" "}
                <Link href="/register" className="text-purple hover:text-purple-light font-medium">Criar conta</Link>
              </p>
              <p className="text-sm">
                É professor?{" "}
                <Link href="/register/teacher" className="text-green-400 hover:text-green-300 font-medium">Registar como professor</Link>
              </p>
              <p className="text-sm">
                Representa uma instituição?{" "}
                <Link href="/register/institution" className="text-cyan-400 hover:text-cyan-300 font-medium">Registar instituição</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Carousel (always dark) */}
      <div className="relative hidden lg:flex w-[55%] flex-col items-center justify-center bg-gray-900 overflow-hidden">
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
        <div className="carousel-overlay absolute inset-0 bg-gray-950/20 z-10 pointer-events-none" />
        <div className="carousel-gradient absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent z-10 pointer-events-none" />
        <Link href="/" className="absolute left-10 top-10 z-20 flex items-center gap-4 hover:opacity-80 transition-opacity">
          <img src="/Logo-Academy-White.svg" alt="Academy" className="h-12 w-auto brightness-0 invert" />
          <span className="text-3xl font-light text-white/40">|</span>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Netsulwel" className="h-7 w-auto brightness-0 invert" />
            <span className="text-2xl font-bold carousel-title">Netsulwel</span>
          </div>
        </Link>
        <div className="absolute bottom-16 left-10 right-10 z-20">
          <h2 className="carousel-title text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-xl transition-all duration-500">
            {carouselSlides[slideIndex].title}
          </h2>
          <p className="carousel-desc mt-4 text-lg text-gray-200 drop-shadow-md max-w-lg transition-all duration-500">
            {carouselSlides[slideIndex].desc}
          </p>
          <div className="mt-8 flex gap-3">
            {carouselSlides.map((_, i) => (
              <div key={i} className={`h-1.5 transition-all duration-300 ${i === slideIndex ? "w-8 carousel-indicator-active" : "w-2 carousel-indicator"}`} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
