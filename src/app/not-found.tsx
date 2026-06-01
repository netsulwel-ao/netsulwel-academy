import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="flex h-20 w-20 items-center justify-center bg-purple-500/10 rounded-full mb-6">
          <span className="text-4xl font-bold text-purple">404</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Página não encontrada</h1>
        <p className="text-gray-400 mb-8">
          A página que procuras não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-6 py-3 font-bold transition-colors"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
