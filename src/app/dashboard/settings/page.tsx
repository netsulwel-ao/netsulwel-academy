"use client";

import { useState, useEffect, useRef } from "react";
import {
  User, Shield, Loader2, Save, Camera,
  AlertCircle, CheckCircle2, Play,
  Trash2, LogOut, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  updateProfile, deleteUser,
  EmailAuthProvider, reauthenticateWithCredential,
} from "firebase/auth";
import { ImageCropModal } from "@/components/ImageCropModal";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Avatar } from "@/components/ui/Avatar";
import { logger } from "@/lib/logger";

// ── Helpers de vídeo ──────────────────────────────────────────
function getYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "").trim() || null;
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return id;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("embed");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
    return null;
  } catch { return null; }
}

function getVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("vimeo.com")) return null;
    return u.pathname.split("/").filter(Boolean).pop() || null;
  } catch { return null; }
}

function buildVideoSource(url: string) {
  const yt = getYoutubeId(url);
  if (yt) return { type: "youtube" as const, youtubeId: yt };
  const vi = getVimeoId(url);
  if (vi) return { type: "vimeo" as const, vimeoId: vi };
  return { type: "direct" as const, src: url };
}

// ─────────────────────────────────────────────────────────────
export default function DashboardSettingsPage() {
  const { user, isAdmin, refreshUser, logout } = useAuth();

  // Perfil
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");
  const [displayName, setDisplayName]   = useState("");
  const [photoURL, setPhotoURL]         = useState("");
  const [bannerURL, setBannerURL]       = useState("");
  const [bio, setBio]                   = useState("");
  const [promoVideoUrl, setPromoVideoUrl] = useState("");
  const [bannerCropImage, setBannerCropImage] = useState<string | null>(null);
  const [avatarCropImage, setAvatarCropImage] = useState<string | null>(null);

  const photoInputRef       = useRef<HTMLInputElement>(null);
  const bannerInputRef      = useRef<HTMLInputElement>(null);
  const promoVideoInputRef  = useRef<HTMLInputElement>(null);

  // Danger Zone
  const [showDelete, setShowDelete]     = useState(false);
  const [deletePass, setDeletePass]     = useState("");
  const [deleting, setDeleting]         = useState(false);
  const [deleteErr, setDeleteErr]       = useState("");

  // ── Carregar dados ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? "");
    setPhotoURL(user.photoURL ?? "");
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (!snap.exists()) return;
      const d = snap.data();
      setBio(d.bio ?? "");
      setPhotoURL(d.photoURL ?? user.photoURL ?? "");
      setBannerURL(d.bannerURL ?? "");
      setPromoVideoUrl(d.promoVideoUrl ?? "");
    }).catch(() => {});
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Guardar perfil ─────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setError(""); setSuccess(""); setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: displayName.trim() || user.displayName,
        photoURL, bio, bannerURL, promoVideoUrl,
      });
      await updateProfile(user, {
        displayName: displayName.trim() || null,
        photoURL: photoURL || null,
      });
      await refreshUser();
      setSuccess("Perfil actualizado com sucesso!");
    } catch (err) {
      logger.error("Settings: save failed", err);
      setError("Erro ao guardar perfil.");
    } finally {
      setSaving(false);
    }
  };

  // ── Upload helper ──────────────────────────────────────────
  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const token = await user!.getIdToken();
    const res = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
    });
    if (!res.ok) throw new Error("presign failed");
    const { presignedUrl, publicUrl } = await res.json();
    const up = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!up.ok) throw new Error("upload failed");
    return publicUrl;
  };

  // ── Eliminar conta ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!user || !auth.currentUser) return;
    setDeleting(true); setDeleteErr("");
    try {
      if (deletePass) {
        const cred = EmailAuthProvider.credential(user.email!, deletePass);
        await reauthenticateWithCredential(auth.currentUser, cred);
      }
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(auth.currentUser);
      window.location.href = "/";
    } catch (err) {
      logger.error("Settings: delete account failed", err);
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setDeleteErr("Palavra-passe incorrecta.");
      } else if (code === "auth/requires-recent-login") {
        setDeleteErr("Faz logout e volta a entrar antes de eliminar a conta.");
      } else {
        setDeleteErr("Erro ao eliminar. Tenta novamente.");
      }
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* Cabeçalho */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-gray-600 mb-2">// definições</p>
        <h1 className="text-2xl font-bold text-gray-100">Definições da conta</h1>
        <p className="mt-1 text-sm text-gray-600">Perfil, preferências e segurança.</p>
      </div>

      {/* Alerts globais */}
      {error && (
        <div className="flex items-start gap-2.5 border border-red-500 bg-red-500/5 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" strokeWidth={1.5} />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2.5 border border-green-500 bg-green-500/5 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" strokeWidth={1.5} />
          <p className="text-sm text-green">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── EDITAR PERFIL ── */}
        <div className="border border-gray-800 bg-gray-900 p-6 space-y-5">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1">// perfil</p>
            <h2 className="text-base font-bold text-gray-200 flex items-center gap-2">
              <User className="h-4 w-4 text-purple" strokeWidth={1.5} /> Editar perfil
            </h2>
          </div>

          {/* Foto */}
          <div>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">foto de perfil</p>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden border border-gray-800">
                <Avatar uid={user?.uid ?? ""} photoURL={photoURL} name={displayName} size={56} />
              </div>
              <button type="button" onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-500 hover:border-gray-700 hover:text-gray-300 transition-all">
                <Camera className="h-3.5 w-3.5" strokeWidth={1.5} /> Alterar foto
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  setError(""); setSuccess("");
                  try {
                    const url = await uploadFile(file, "avatars");
                    setPhotoURL(url);
                    setSuccess("Foto carregada. Clica em Guardar para salvar.");
                  } catch (err) {
                    logger.error("Settings: photo upload", err);
                    setError("Erro ao fazer upload da foto.");
                  }
                  e.target.value = "";
                }} />
            </div>
          </div>

          {/* Banner */}
          <div>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">banner / capa</p>
            <div className="flex items-center gap-4">
              <div className="h-14 w-24 shrink-0 overflow-hidden border border-gray-800 bg-gray-900">
                {bannerURL
                  ? <img src={bannerURL} alt="Banner" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center"><Camera className="h-4 w-4 text-gray-700" strokeWidth={1} /></div>
                }
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-700 hover:text-gray-300 transition-all">
                  <Camera className="h-3 w-3" strokeWidth={1.5} />
                  {bannerURL ? "Alterar" : "Adicionar"}
                </button>
                {bannerURL && (
                  <button type="button" onClick={() => setBannerURL("")}
                    className="text-sm text-gray-700 hover:text-red-400 transition-colors">Remover</button>
                )}
              </div>
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setBannerCropImage(reader.result as string);
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }} />
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="font-mono text-[13px] uppercase tracking-widest text-gray-700">nome</label>
            <input id="displayName" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="O teu nome"
              className="w-full border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-gray-200 focus:border-purple focus:outline-none transition-colors" />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label htmlFor="bio" className="font-mono text-[13px] uppercase tracking-widest text-gray-700">biografia</label>
            <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Fala sobre ti..."
              className="w-full border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-gray-200 focus:border-purple focus:outline-none transition-colors resize-none" />
          </div>

          {/* Vídeo */}
          <div className="space-y-1.5">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">vídeo de apresentação</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => promoVideoInputRef.current?.click()}
                className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-500 hover:border-gray-700 hover:text-gray-300 transition-all shrink-0">
                <Play className="h-3 w-3" strokeWidth={1.5} /> Upload
              </button>
              <input type="url" value={promoVideoUrl} onChange={e => setPromoVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-200 focus:border-purple focus:outline-none transition-colors" />
              <input ref={promoVideoInputRef} type="file" accept="video/*" className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  setError(""); setSuccess("");
                  try {
                    const url = await uploadFile(file, "videos");
                    setPromoVideoUrl(url);
                    setSuccess("Vídeo carregado. Clica em Guardar para salvar.");
                  } catch (err) {
                    logger.error("Settings: video upload", err);
                    setError("Erro ao fazer upload do vídeo.");
                  }
                  e.target.value = "";
                }} />
            </div>
            {promoVideoUrl && (
              <div className="mt-2 aspect-video max-w-xs overflow-hidden border border-gray-800 bg-gray-950">
                <VideoPlayer source={buildVideoSource(promoVideoUrl)} />
              </div>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">email</p>
            <input type="text" value={user?.email ?? ""} disabled
              className="w-full border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-gray-700 cursor-not-allowed" />
          </div>

          {/* Guardar */}
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-purple px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-light disabled:opacity-50 transition-colors">
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar...</>
              : <><Save className="h-4 w-4" /> Guardar perfil</>
            }
          </button>
        </div>

        {/* ── CONTA + DANGER ZONE ── */}
        <div className="space-y-5">

          {/* Info da conta */}
          <div className="border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4">
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1">// conta</p>
              <h2 className="text-base font-bold text-gray-200 flex items-center gap-2">
                <Shield className="h-4 w-4 text-green" strokeWidth={1.5} /> Informações
              </h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Email", value: user?.email ?? "" },
                { label: "UID",   value: user?.uid ?? "" },
                { label: "Email verificado", value: user?.emailVerified ? "sim" : "não" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between border-b border-gray-800 pb-2.5 last:border-0 last:pb-0">
                  <span className="font-mono text-[13px] uppercase tracking-widest text-gray-700">{label}</span>
                  <span className="font-mono text-[13px] text-gray-500 truncate max-w-[200px]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="border border-red-500">
            <div className="flex items-center gap-2 border-b border-red-500 bg-red-500/5 px-5 py-3">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" strokeWidth={1.5} />
              <p className="font-mono text-[13px] uppercase tracking-widest text-red-400">// zona de perigo</p>
            </div>

            <div className="p-5 space-y-5">
              {/* Logout */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-300">Terminar sessão</p>
                  <p className="text-sm text-gray-600 mt-0.5">Sai da conta neste dispositivo.</p>
                </div>
                <button type="button"
                  onClick={async () => { await logout(); }}
                  className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:border-gray-700 hover:text-gray-400 transition-all shrink-0">
                  <LogOut className="h-3 w-3" strokeWidth={1.5} /> Sair
                </button>
              </div>

              <div className="border-t border-gray-800" />

              {/* Eliminar conta */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-red-400">Eliminar conta</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Remove permanentemente a conta e todos os dados. Irreversível.
                  </p>
                </div>
                <button type="button"
                  onClick={() => { setShowDelete(true); setDeleteErr(""); setDeletePass(""); }}
                  className="flex items-center gap-1.5 border border-red-500 bg-red-500/8 px-3 py-2 font-mono text-[13px] uppercase tracking-widest text-red-400 hover:bg-red-500/15 transition-all shrink-0">
                  <Trash2 className="h-3 w-3" strokeWidth={1.5} /> Eliminar
                </button>
              </div>

              {/* Confirmação inline */}
              {showDelete && (
                <div className="border border-red-500 bg-red-500/5 p-4 space-y-3">
                  <p className="text-sm text-red-400 leading-relaxed">
                    <strong className="text-red-400">Atenção:</strong> esta acção é permanente e não pode ser desfeita.
                    Todos os dados serão eliminados.
                  </p>
                  <input type="password" value={deletePass} onChange={e => setDeletePass(e.target.value)}
                    placeholder="Confirma a tua palavra-passe"
                    className="w-full border border-red-500 bg-gray-900 px-3 py-2 text-sm text-gray-300 focus:border-red-500 focus:outline-none transition-colors" />
                  {deleteErr && <p className="text-sm text-red-400">{deleteErr}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDelete(false)}
                      className="flex-1 border border-gray-800 bg-gray-900 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors">
                      Cancelar
                    </button>
                    <button type="button" onClick={handleDelete} disabled={deleting || !deletePass}
                      className="flex flex-1 items-center justify-center gap-1.5 border border-red-500 bg-red-500/15 py-2 font-mono text-[13px] uppercase tracking-widest text-red-400 hover:bg-red-500/25 disabled:opacity-50 transition-all">
                      {deleting
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <><Trash2 className="h-3 w-3" /> Confirmar</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modais de crop */}
      {avatarCropImage && user && (
        <ImageCropModal imageUrl={avatarCropImage} title="Ajustar foto de perfil"
          aspectRatio={1} outputWidth={400} outputHeight={400}
          onCancel={() => setAvatarCropImage(null)}
          onConfirm={async blob => {
            try {
              const ext = blob.type === "image/png" ? "png" : "webp";
              const file = new File([blob], `avatar.${ext}`, { type: blob.type });
              const url = await uploadFile(file, "avatars");
              setPhotoURL(url);
            } catch (err) {
              logger.error("Settings: avatar crop upload", err);
              setError("Erro ao fazer upload da foto.");
            }
            setAvatarCropImage(null);
          }} />
      )}
      {bannerCropImage && user && (
        <ImageCropModal imageUrl={bannerCropImage} title="Ajustar banner"
          aspectRatio={1200 / 340} outputWidth={1200} outputHeight={340}
          onCancel={() => setBannerCropImage(null)}
          onConfirm={async blob => {
            try {
              const ext = blob.type === "image/png" ? "png" : "webp";
              const file = new File([blob], `banner.${ext}`, { type: blob.type });
              const url = await uploadFile(file, "avatars");
              setBannerURL(url);
            } catch (err) {
              logger.error("Settings: banner crop upload", err);
              setError("Erro ao fazer upload do banner.");
            }
            setBannerCropImage(null);
          }} />
      )}
    </div>
  );
}
