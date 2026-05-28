import Link from "next/link";
import { Code2, Share2, Play, MessagesSquare } from "lucide-react";

const links = {
 Produto: [
 { label: "Trilhas", href: "#trilhas" },
 { label: "Planos", href: "#planos" },
 { label: "Comunidade", href: "#comunidade" },
 { label: "Blog", href: "#blog" },
 ],
 Empresa: [
 { label: "Sobre", href: "#sobre" },
 { label: "Carreiras", href: "#carreiras" },
 { label: "Parceiros", href: "#parceiros" },
 { label: "Contato", href: "#contato" },
 ],
 Legal: [
 { label: "Termos de uso", href: "#termos" },
 { label: "Privacidade", href: "#privacidade" },
 { label: "Cookies", href: "#cookies" },
 ],
};

const socials = [
 { label: "GitHub", icon: Code2 },
 { label: "Instagram", icon: Share2 },
 { label: "YouTube", icon: Play },
 { label: "Discord", icon: MessagesSquare },
];

export function Footer() {
 return (
 <footer className="border-t border-gray-800 py-16">
 <div className="mx-auto max-w-6xl px-6">
  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-5 lg:gap-16">
 <div className="md:col-span-2">
  <Link href="/" className="flex items-center gap-3 sm:gap-4 flex-wrap">
 <img src="/Logo-Academy-White.svg" alt="Academy Logo" className="h-16 w-auto sm:h-20" />
 <span className="text-3xl font-light text-gray-600 sm:text-4xl">|</span>
 <div className="flex items-center gap-2">
 <img src="/logo.svg" alt="Netsulwel Logo" className="h-8 w-auto brightness-0 invert sm:h-10" />
 <span className="text-xl font-bold text-white sm:text-2xl">
 Netsulwel
 </span>
 </div>
 </Link>
 <p className="mt-6 text-sm leading-relaxed text-gray-300">
 Tech, finanças e investimentos — impulsionando você para o
 próximo nível.
 </p>
 </div>

 {Object.entries(links).map(([title, items]) => (
 <div key={title}>
 <h4 className="font-semibold text-gray-100">{title}</h4>
 <ul className="mt-4 space-y-2">
 {items.map((item) => (
 <li key={item.label}>
 <a
 href={item.href}
 className="text-sm text-gray-300 transition-colors hover:text-purple-light"
 >
 {item.label}
 </a>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-gray-800 pt-8 md:flex-row">
          <p className="text-sm text-gray-300">
            © {new Date().getFullYear()} Netsulwel Academy. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            {socials.map(({ label, icon: Icon }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 text-gray-300 transition-all hover:border-purple/50 hover:text-purple-light"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
