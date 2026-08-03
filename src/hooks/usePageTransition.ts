import { useTransition } from "@/contexts/TransitionContext";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Hook to handle page transitions with animation
 * 
 * Usage:
 * ```tsx
 * const navigate = usePageTransition();
 * navigate("/dashboard");
 * ```
 */
export function usePageTransition() {
  const router = useRouter();
  const { startTransition } = useTransition();

  const navigate = useCallback(
    (href: string, options?: { preserveScroll?: boolean }) => {
      // Start the exit animation
      startTransition();
      
      // Wait for exit animation to complete before navigating
      setTimeout(() => {
        router.push(href);
      }, 200); // Exit animation duration
    },
    [router, startTransition]
  );

  return navigate;
}
