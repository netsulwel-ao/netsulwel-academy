"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Settings, User, Shield, ArrowUpRight, Loader2, Save, Camera, AlertCircle, CheckCircle2, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ImageCropModal } from "@/components/ImageCropModal";
import { VideoPlayer } from "@/components/VideoPlayer";

function getYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "").trim() || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return id;
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

function getVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("vimeo.com")) return null;
    return u.pathname.split("/").filter(Boolean).pop() || null;
  } catch {
    return null;
  }
}

function buildVideoSource(url: string) {
  const youtubeId = getYoutubeId(url);
  if (youtubeId) return { type: "youtube" as const, youtubeId };
  const vimeoId = getVimeoId(url);
  if (vimeoId) return { type: "vimeo" as const, vimeoId };
  return { type: "direct" as const, src: url };
}

export default function DashboardSettingsPage() {
  const { user, isAdmin, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [bannerURL, setBannerURL] = useState("");
  const [bannerCropImage, setBannerCropImage] = useState<string | null>(null);
  const [avatarCropImage, setAvatarCropImage] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [promoVideoUrl, setPromoVideoUrl] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const promoVideoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || "");
    setPhotoURL(user.photoURL || "");
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setBio(data.bio || "");
        setPhotoURL(data.photoURL || user.photoURL || "");
        setBannerURL(data.bannerURL || "");
        setPromoVideoUrl(data.promoVideoUrl || "");
      }
    }).catch(() => {});
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      if (displayName.trim()) updates.name = displayName.trim();
      if (photoURL) updates.photoURL = photoURL;
      if (bio !== undefined) updates.bio = bio;
      if (bannerURL !== undefined) updates.bannerURL = bannerURL;
      if (promoVideoUrl !== undefined) updates.promoVideoUrl = promoVideoUrl;

      await updateDoc(doc(db, "users", user.uid), updates);
      await updateProfile(user, { displayName: displayName.trim() || null, photoURL: photoURL || null });
      await refreshUser();
      setSuccess("Perfil actualizado com sucesso!");
    } catch {
      setError("Erro ao guardar perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[100rem] mx-auto animate-in fade-in duration-500">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-500/10 border border-gray-700/60 flex items-center justify-center shrink-0">
          <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-gray-300" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Definições</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-400">Dados do perfil e preferências da conta.</p>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="mt-6 flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{success}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Edit */}
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="h-5 w-5 text-purple-300" /> Editar Perfil
          </h2>

          <div className="mt-4 space-y-5">
            {/* Photo */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Foto de Perfil</label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-800 border border-gray-700">
                  {photoURL ? (
                    <img src={photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xl font-bold">
                      {user?.displayName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm transition-colors">
                  <Camera className="h-4 w-4" />
                  Alterar foto
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  setError(""); setSuccess("");
                  try {
                    const token = await user.getIdToken();
                    const res = await fetch("/api/upload/presign", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ filename: file.name, contentType: file.type, folder: "avatars" }),
                    });
                    if (!res.ok) throw new Error("Erro ao obter URL");
                    const { presignedUrl, publicUrl } = await res.json();
                    const uploadRes = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
                    if (!uploadRes.ok) throw new Error("Erro ao fazer upload");
                    setPhotoURL(publicUrl);
                    setSuccess("Foto carregada! Clica em Guardar Perfil para salvar.");
                  } catch (err) {
                    console.error("Upload direto falhou:", err);
                    setError("Erro ao fazer upload da foto.");
                  }
                  e.target.value = "";
                }} className="hidden" />
              </div>
            </div>

            {/* Banner */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Banner / Capa</label>
              <div className="flex items-center gap-4">
                {bannerURL ? (
                  <div className="relative w-40 h-20 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                    <img src={bannerURL} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-40 h-20 rounded-lg bg-gradient-to-br from-purple-900/30 via-gray-900 to-gray-950 border border-gray-700 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-gray-600" />
                  </div>
                )}
                <button type="button" onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm transition-colors">
                  <Camera className="h-4 w-4" />
                  {bannerURL ? "Alterar banner" : "Adicionar banner"}
                </button>
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setBannerCropImage(reader.result as string);
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }} className="hidden" />
                {bannerURL && (
                  <button onClick={() => setBannerURL("")}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                    Remover
                  </button>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Nome</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="O teu nome" />
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Biografia</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                className="w-full bg-gray-950 border border-gray-700 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Fala sobre ti..." />
            </div>

            {/* Promo Video */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Vídeo de Apresentação</label>
              <div className="flex items-center gap-3 mb-2">
                <button type="button" onClick={() => promoVideoInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm transition-colors">
                  <Play className="h-4 w-4" />
                  {promoVideoUrl ? "Alterar vídeo" : "Upload vídeo"}
                </button>
                <span className="text-xs text-gray-500">ou</span>
                <input type="url" value={promoVideoUrl} onChange={e => setPromoVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 min-w-0 bg-gray-950 border border-gray-700 px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <input ref={promoVideoInputRef} type="file" accept="video/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;
                setError(""); setSuccess("");
                try {
                  const token = await user.getIdToken();
                  const res = await fetch("/api/upload/presign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ filename: file.name, contentType: file.type || "video/mp4", folder: "videos" }),
                  });
                  if (!res.ok) throw new Error("Erro ao obter URL");
                  const { presignedUrl, publicUrl } = await res.json();
                  const uploadRes = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type || "video/mp4" }, body: file });
                  if (!uploadRes.ok) throw new Error("Erro ao fazer upload");
                  setPromoVideoUrl(publicUrl);
                  setSuccess("Vídeo carregado! Clica em Guardar Perfil para salvar.");
                } catch (err) {
                  console.error("Upload vídeo falhou:", err);
                  setError("Erro ao fazer upload do vídeo.");
                }
                e.target.value = "";
              }} className="hidden" />
              {promoVideoUrl && (
                <div className="mt-3 aspect-video max-w-md rounded-lg overflow-hidden bg-black">
                  <VideoPlayer source={buildVideoSource(promoVideoUrl)} />
                </div>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">Email</label>
              <input type="text" value={user?.email || ""} disabled
                className="w-full bg-gray-950/50 border border-gray-800 px-4 py-3 text-gray-500 cursor-not-allowed" />
            </div>

            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-purple hover:bg-purple-light disabled:opacity-50 text-white px-6 py-3 font-bold transition-colors">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? "A guardar..." : "Guardar Perfil"}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-300" /> Conta
          </h2>
          <p className="mt-2 text-base text-gray-400">
            {isAdmin
              ? "A tua conta tem permissões de administrador."
              : "Em breve vais poder gerir preferências e segurança por aqui."}
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 font-bold transition-colors border border-gray-800"
            >
              Voltar ao início <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
      {avatarCropImage && user && (
        <ImageCropModal
          imageUrl={avatarCropImage}
          title="Ajustar foto de perfil"
          aspectRatio={1}
          outputWidth={400}
          outputHeight={400}
          onCancel={() => setAvatarCropImage(null)}
          onConfirm={async (blob: Blob) => {
            try {
              const token = await user.getIdToken();
              const contentType = blob.type || "image/png";
              const ext = contentType === "image/png" ? "png" : "webp";
              const res = await fetch("/api/upload/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ filename: `avatar.${ext}`, contentType, folder: "avatars" }),
              });
              if (!res.ok) throw new Error();
              const { presignedUrl, publicUrl } = await res.json();
              await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
              setPhotoURL(publicUrl);
              setAvatarCropImage(null);
            } catch {
              setError("Erro ao fazer upload da foto.");
              setAvatarCropImage(null);
            }
          }}
        />
      )}
      {bannerCropImage && user && (
        <ImageCropModal
          imageUrl={bannerCropImage}
          title="Ajustar banner"
          aspectRatio={1200 / 340}
          outputWidth={1200}
          outputHeight={340}
          onCancel={() => setBannerCropImage(null)}
          onConfirm={async (blob: Blob) => {
            try {
              const token = await user.getIdToken();
              const contentType = blob.type || "image/png";
              const ext = contentType === "image/png" ? "png" : "webp";
              const res = await fetch("/api/upload/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ filename: `banner.${ext}`, contentType, folder: "avatars" }),
              });
              if (!res.ok) throw new Error();
              const { presignedUrl, publicUrl } = await res.json();
              await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
              setBannerURL(publicUrl);
              setBannerCropImage(null);
            } catch {
              setError("Erro ao fazer upload do banner.");
              setBannerCropImage(null);
            }
          }}
        />
      )}
    </div>
  );
}
