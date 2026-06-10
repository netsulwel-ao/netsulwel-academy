"use client";

interface LoginFooterProps {
  view: string;
  toggleView: (view: "login" | "register" | "register-institution" | "forgot") => void;
}

export default function LoginFooter({ view, toggleView }: LoginFooterProps) {
  return (
    <p className="mt-8 text-center text-sm text-gray-400 relative z-20">
      {view === "login" && (
        <>
          Não tem nenhuma conta? <button onClick={() => toggleView("register")} className="font-semibold text-purple-light hover:text-purple transition-colors">Registar agora</button>
          {" ou "}
          <button onClick={() => toggleView("register-institution")} className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Registar instituição</button>
        </>
      )}
      {view === "register" && (
        <>Já tem uma conta? <button onClick={() => toggleView("login")} className="font-semibold text-purple-light hover:text-purple transition-colors">Iniciar sessão</button></>
      )}
      {view === "register-institution" && (
        <>Já tem uma conta? <button onClick={() => toggleView("login")} className="font-semibold text-purple-light hover:text-purple transition-colors">Iniciar sessão</button></>
      )}
      {view === "forgot" && (
        <>Lembrou-se da senha? <button onClick={() => toggleView("login")} className="font-semibold text-purple-light hover:text-purple transition-colors">Voltar ao Login</button></>
      )}
    </p>
  );
}
