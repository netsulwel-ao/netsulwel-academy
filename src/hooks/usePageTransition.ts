import { useTransition } from "@/contexts/TransitionContext";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Hook to handle page transitions
 * 
 * Sem cortina de loading: a navegação é imediata e a página de destino
 * faz a entrada animada com o PageTransition.
 * 
 * Usage:
 * ```tsx
 * const navigate = usePageTransition();
 * navigate("/dashboard");
 * ```
 */
export function usePageTransition() {
  const router = useRouter();
  const { startTransition, endTransition } = useTransition();

  const navigate = useCallback(
    (href: string) => {
      // Guarda a posição de scroll e navega imediatamente.
      startTransition();
      router.push(href);
      // Segurança: limpa o estado de transição mesmo se a página alvo
      // não tiver PageTransition (a própria PageTransition também chama endTransition).
      setTimeout(() => endTransition(), 250);
    },
    [router, startTransition, endTransition]
  );

  return navigate;
}
