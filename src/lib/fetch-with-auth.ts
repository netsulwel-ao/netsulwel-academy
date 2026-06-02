import { auth } from "@/lib/firebase";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilizador não autenticado.");
  const token = await user.getIdToken(true);

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    },
  });
}
