import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import type { PrivateAccessLink } from "@/types/access";
import { toast } from "sonner";

export function usePrivateAccessLink() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Gerar um token único, URL-safe
  const generateToken = (): string => {
    return Math.random()
      .toString(36)
      .substring(2, 15)
      .concat(Math.random().toString(36).substring(2, 15));
  };

  // Criar um novo link privado
  const createLink = async (
    courseId?: string,
    liveId?: string,
    expiresIn?: number, // ms do agora
    maxUses?: number
  ): Promise<PrivateAccessLink | null> => {
    if (!user || !courseId && !liveId) {
      toast.error("Dados inválidos");
      return null;
    }

    setLoading(true);
    try {
      const token = generateToken();
      const expiresAt = expiresIn
        ? Date.now() + expiresIn
        : undefined;

      const newLink: Omit<PrivateAccessLink, "id"> = {
        token,
        courseId,
        liveId,
        createdBy: user.uid,
        createdAt: Date.now(),
        expiresAt,
        maxUses,
        usedCount: 0,
        usedBy: [],
        status: "active",
      };

      const docRef = await addDoc(
        collection(db, "private_access_links"),
        newLink
      );

      const link: PrivateAccessLink = {
        id: docRef.id,
        ...newLink,
      };

      toast.success("Link privado criado com sucesso!");
      return link;
    } catch (error) {
      console.error("Erro ao criar link privado:", error);
      toast.error("Erro ao criar link");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Revogar um link
  const revokeLink = async (linkId: string): Promise<boolean> => {
    if (!linkId) return false;

    setLoading(true);
    try {
      await updateDoc(doc(db, "private_access_links", linkId), {
        status: "revoked",
      });
      toast.success("Link revogado com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao revogar link:", error);
      toast.error("Erro ao revogar link");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar todos os links criados pelo usuário
  const fetchMyLinks = async (
    courseId?: string,
    liveId?: string
  ): Promise<PrivateAccessLink[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      const linksRef = collection(db, "private_access_links");
      let q;

      if (courseId) {
        q = query(
          linksRef,
          where("createdBy", "==", user.uid),
          where("courseId", "==", courseId)
        );
      } else if (liveId) {
        q = query(
          linksRef,
          where("createdBy", "==", user.uid),
          where("liveId", "==", liveId)
        );
      } else {
        q = query(linksRef, where("createdBy", "==", user.uid));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PrivateAccessLink[];
    } catch (error) {
      console.error("Erro ao buscar links:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Gerar URL completa do link
  const getShareUrl = (token: string): string => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/access/${token}`;
    }
    return ``;
  };

  return {
    createLink,
    revokeLink,
    fetchMyLinks,
    getShareUrl,
    loading,
  };
}
