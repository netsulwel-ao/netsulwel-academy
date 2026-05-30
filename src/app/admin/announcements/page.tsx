"use client";


import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, query,
} from "firebase/firestore";
import {
  Plus, Trash2, Pencil, Loader2, X, Save, AlertCircle, CheckCircle2,
  Megaphone, Zap, BookOpen, Radio, Bell,
  Eye, EyeOff, Users, Calendar, LinkIcon, ImagePlus, Sparkles,
  Clock, ChevronDown, ChevronUp, Timer,
} from "lucide-react";
import type { Announcement, AnnouncementType, AnnouncementTarget, CountdownBanner, CountdownVariant } from "@/types/announcement";
import { VARIANT_LABELS } from "@/types/announcement";
import { toast } from "sonner";
import IconPicker, { getIcon, getLucideIcon, AVAILABLE_ICONS } from "@/components/admin/IconPicker";

// ── Upload ────────────────────────────────────────────────
async function uploadToR2(file: File, folder: string): Promise<string> {
  const res = await fetch("/api/upload/presign", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
  });
  if (!res.ok) throw new Error("Falha ao obter URL.");
  const { presignedUrl, publicUrl } = await res.json();
  const up = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!up.ok) throw new Error("Falha ao enviar.");
  return publicUrl;
}

// ── Config ────────────────────────────────────────────────
const TYPE_CONFIG: Record<AnnouncementType, { label: string; icon: React.ElementType; color: string; bg: string; accent: string }> = {
  promo:      { label: "Promoção",     icon: Zap,      color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", accent: "bg-yellow-500 text-gray-900" },
  new_course: { label: "Novo Curso",   icon: BookOpen, color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30",   accent: "bg-blue-600 text-white" },
  live:       { label: "Aula ao Vivo", icon: Radio,    color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",     accent: "bg-red-600 text-white" },
  general:    { label: "Aviso Geral",  icon: Megaphone,color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", accent: "bg-purple-600 text-white" },
};

const TARGET_LABELS: Record<AnnouncementTarget, string> = {
  all: "Todos", free: "Plano Free", smart: "Plano Smart", golden: "Plano Golden",
};

const COUNTDOWN_COLORS = ["red","yellow","blue","green","purple"] as const;

const EMPTY_ANN: Omit<Announcement, "id"|"createdAt"|"updatedAt"> = {
  type: "general", title: "", body: "", ctaLabel: "", ctaUrl: "",
  imageUrl: "", target: "all", active: true, showOnce: false, expiresAt: "",
  benefits: [], badgeLabel: "",
};

const EMPTY_CD: Omit<CountdownBanner, "id"|"createdAt"|"updatedAt"> = {
  active: true, label: "", endsAt: "", ctaLabel: "", ctaUrl: "", imageUrl: "", badgeLabel: "",
  color: "red", variant: 1, target: "all",
};

export default function AnnouncementsPage() {
  // ── Announcements state ───────────────────────────────────
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnn, setLoadingAnn] = useState(true);
  const [savingAnn, setSavingAnn] = useState(false);
  const [annError, setAnnError] = useState("");
  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string|null>(null);
  const [annForm, setAnnForm] = useState({...EMPTY_ANN});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [iconPickerIdx, setIconPickerIdx] = useState<number|null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Countdown state ───────────────────────────────────────
  const [countdowns, setCountdowns] = useState<CountdownBanner[]>([]);
  const [loadingCD, setLoadingCD] = useState(true);
  const [savingCD, setSavingCD] = useState(false);
  const [cdError, setCdError] = useState("");
  const [cdModalOpen, setCdModalOpen] = useState(false);
  const [editingCdId, setEditingCdId] = useState<string|null>(null);
  const [cdForm, setCdForm] = useState({...EMPTY_CD});
  const [cdImageUploading, setCdImageUploading] = useState(false);
  const [cdImagePreview, setCdImagePreview] = useState("");
  const cdImageInputRef = useRef<HTMLInputElement>(null);

  // ── Active tab ────────────────────────────────────────────
  const [tab, setTab] = useState<"announcements"|"countdowns">("announcements");

  // ── Fetch ─────────────────────────────────────────────────
  useEffect(() => {
    getDocs(query(collection(db,"announcements"), orderBy("createdAt","desc")))
      .then(s => setAnnouncements(s.docs.map(d=>({id:d.id,...d.data()} as Announcement))))
      .catch(()=>toast.error("Erro ao carregar anúncios."))
      .finally(()=>setLoadingAnn(false));
    getDocs(query(collection(db,"countdownBanners"), orderBy("createdAt","desc")))
      .then(s => setCountdowns(s.docs.map(d=>({id:d.id,...d.data()} as CountdownBanner))))
      .catch(()=>toast.error("Erro ao carregar banners."))
      .finally(()=>setLoadingCD(false));
  }, []);

  // ── Ann modal ─────────────────────────────────────────────
  const openCreateAnn = () => { setAnnForm({...EMPTY_ANN}); setEditingAnnId(null); setAnnError(""); setImagePreview(""); setPreviewOpen(false); setAnnModalOpen(true); };
  const openEditAnn = (a:Announcement) => {
    setAnnForm({ type:a.type, title:a.title, body:a.body, ctaLabel:a.ctaLabel??"", ctaUrl:a.ctaUrl??"",
      imageUrl:a.imageUrl??"", target:a.target, active:a.active, showOnce:a.showOnce,
      expiresAt:a.expiresAt??"", benefits:a.benefits??[], badgeLabel:a.badgeLabel??"" });
    setImagePreview(a.imageUrl??""); setEditingAnnId(a.id!); setAnnError(""); setPreviewOpen(false); setAnnModalOpen(true);
  };

  // ── Image upload ──────────────────────────────────────────
  const handleImageChange = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return;
    setImagePreview(URL.createObjectURL(file)); setImageUploading(true); setAnnError("");
    try { const url = await uploadToR2(file,"announcements"); setAnnForm(f=>({...f,imageUrl:url})); }
    catch { setAnnError("Erro ao fazer upload da imagem."); setImagePreview(annForm.imageUrl??""); }
    finally { setImageUploading(false); }
  };

  // ── AI generate ───────────────────────────────────────────
  const handleGenerateAI = async () => {
    setGeneratingAI(true); setAnnError("");
    try {
      const res = await fetch("/api/ai/generate-announcement", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({type:annForm.type, title:annForm.title, target:annForm.target}),
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error??"Erro");
      // Converte emojis em nomes de ícones se necessário
      const benefits = (data.benefits??[]).map((b:{ icon?:string; title:string; desc?:string }, i:number) => ({
        icon: AVAILABLE_ICONS[i % AVAILABLE_ICONS.length].name,
        title: b.title, desc: b.desc,
      }));
      setAnnForm(f=>({...f, title:data.title??f.title, body:data.body??f.body,
        ctaLabel:data.ctaLabel??f.ctaLabel, badgeLabel:data.badgeLabel??f.badgeLabel, benefits }));
    } catch(err:unknown) { setAnnError(err instanceof Error ? err.message : "Erro ao gerar."); }
    finally { setGeneratingAI(false); }
  };

  // ── Save announcement ─────────────────────────────────────
  const handleSaveAnn = async () => {
    if(!annForm.title.trim()) { setAnnError("O título é obrigatório."); return; }
    if(!annForm.body.trim()) { setAnnError("A mensagem é obrigatória."); return; }
    setSavingAnn(true); setAnnError("");
    try {
      const payload = {...annForm, title:annForm.title.trim(), body:annForm.body.trim(), updatedAt:serverTimestamp()};
      if(editingAnnId) { await updateDoc(doc(db,"announcements",editingAnnId),payload); toast.success("Anúncio atualizado."); }
      else { await addDoc(collection(db,"announcements"),{...payload,createdAt:serverTimestamp()}); toast.success("Anúncio criado."); }
      setAnnModalOpen(false);
      const s = await getDocs(query(collection(db,"announcements"),orderBy("createdAt","desc")));
      setAnnouncements(s.docs.map(d=>({id:d.id,...d.data()} as Announcement)));
    } catch { setAnnError("Erro ao guardar."); }
    finally { setSavingAnn(false); }
  };

  const toggleAnnActive = async (a:Announcement) => {
    try {
      await updateDoc(doc(db,"announcements",a.id!),{active:!a.active,updatedAt:serverTimestamp()});
      setAnnouncements(p=>p.map(x=>x.id===a.id?{...x,active:!x.active}:x));
    } catch { toast.error("Erro ao atualizar."); }
  };

  const deleteAnn = async (id:string) => {
    toast("Apagar este anúncio?", {
      action: { label: "Apagar", onClick: async () => {
        try {
          await deleteDoc(doc(db,"announcements",id));
          setAnnouncements(p=>p.filter(x=>x.id!==id));
          toast.success("Anúncio apagado.");
        } catch { toast.error("Erro ao apagar anúncio."); }
      }},
      cancel: "Cancelar",
      duration: Infinity,
    });
  };

  const handleCdImageChange = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return;
    setCdImagePreview(URL.createObjectURL(file)); setCdImageUploading(true); setCdError("");
    try { const url = await uploadToR2(file,"countdowns"); setCdForm(f=>({...f,imageUrl:url})); }
    catch { setCdError("Erro ao fazer upload da imagem."); setCdImagePreview(cdForm.imageUrl??""); }
    finally { setCdImageUploading(false); }
  };

  const openCreateCD = () => { setCdForm({...EMPTY_CD}); setEditingCdId(null); setCdError(""); setCdImagePreview(""); setCdModalOpen(true); };
  const openEditCD = (b:CountdownBanner) => {
    setCdForm({active:b.active, label:b.label, endsAt:b.endsAt.slice(0,16),
      ctaLabel:b.ctaLabel??"", ctaUrl:b.ctaUrl??"", imageUrl:b.imageUrl??"", badgeLabel:b.badgeLabel??"",
      color:b.color, variant:b.variant??1, target:b.target});
    setCdImagePreview(b.imageUrl??""); setEditingCdId(b.id!); setCdError(""); setCdModalOpen(true);
  };

  const handleSaveCD = async () => {
    if(!cdForm.label.trim()) { setCdError("O texto é obrigatório."); return; }
    if(!cdForm.endsAt) { setCdError("A data/hora de fim é obrigatória."); return; }
    setSavingCD(true); setCdError("");
    try {
      const payload = {...cdForm, label:cdForm.label.trim(), updatedAt:serverTimestamp()};
      if(editingCdId) { await updateDoc(doc(db,"countdownBanners",editingCdId),payload); toast.success("Banner atualizado."); }
      else { await addDoc(collection(db,"countdownBanners"),{...payload,createdAt:serverTimestamp()}); toast.success("Banner criado."); }
      setCdModalOpen(false);
      const s = await getDocs(query(collection(db,"countdownBanners"),orderBy("createdAt","desc")));
      setCountdowns(s.docs.map(d=>({id:d.id,...d.data()} as CountdownBanner)));
    } catch { setCdError("Erro ao guardar."); }
    finally { setSavingCD(false); }
  };

  const toggleCdActive = async (b:CountdownBanner) => {
    try {
      await updateDoc(doc(db,"countdownBanners",b.id!),{active:!b.active,updatedAt:serverTimestamp()});
      setCountdowns(p=>p.map(x=>x.id===b.id?{...x,active:!x.active}:x));
    } catch { toast.error("Erro ao atualizar banner."); }
  };

  const deleteCD = async (id:string) => {
    toast("Apagar este banner?", {
      action: { label: "Apagar", onClick: async () => {
        try {
          await deleteDoc(doc(db,"countdownBanners",id));
          setCountdowns(p=>p.filter(x=>x.id!==id));
          toast.success("Banner apagado.");
        } catch { toast.error("Erro ao apagar banner."); }
      }},
      cancel: "Cancelar",
      duration: Infinity,
    });
  };

  const cfg = TYPE_CONFIG[annForm.type];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Marketing & Comunicação</h1>
          <p className="mt-1 text-gray-400">Popups, anúncios e banners de contagem regressiva</p>
        </div>
        <button onClick={tab==="announcements"?openCreateAnn:openCreateCD}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold transition-colors">
          <Plus className="w-4 h-4"/>
          {tab==="announcements"?"Novo Anúncio":"Novo Banner"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {([["announcements","Anúncios & Popups",Bell],["countdowns","Contagem Regressiva",Timer]] as const).map(([t,l,Icon])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab===t?"border-blue-500 text-white":"border-transparent text-gray-500 hover:text-gray-300"}`}>
            <Icon className="h-4 w-4"/>{l}
          </button>
        ))}
      </div>

      {/* ── ANNOUNCEMENTS TAB ── */}
      {tab==="announcements" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.entries(TYPE_CONFIG) as [AnnouncementType, typeof TYPE_CONFIG[AnnouncementType]][]).map(([type,c])=>{
              const count = announcements.filter(a=>a.type===type&&a.active).length;
              const Icon = c.icon;
              return (
                <div key={type} className={`flex items-center gap-4 p-4 border ${c.bg}`}>
                  <Icon className={`h-6 w-6 shrink-0 ${c.color}`}/>
                  <div><p className="text-xs text-gray-500">{c.label}</p><p className="text-2xl font-bold text-white">{count}</p></div>
                </div>
              );
            })}
          </div>

          {loadingAnn?<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>
          :announcements.length===0?(
            <div className="flex flex-col items-center justify-center py-20 bg-gray-900/40 text-center">
              <Bell className="h-12 w-12 text-gray-700 mb-3"/>
              <p className="text-gray-400 font-medium">Nenhum anúncio criado</p>
            </div>
          ):(
            <div className="space-y-3">
              {announcements.map(a=>{
                const c=TYPE_CONFIG[a.type]; const Icon=c.icon;
                return (
                  <div key={a.id} className={`flex items-center gap-4 p-5 border bg-gray-900/40 transition-all ${a.active?"border-gray-800":"border-gray-800/40 opacity-60"}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${c.bg}`}><Icon className={`h-5 w-5 ${c.color}`}/></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold uppercase tracking-wider ${c.color}`}>{c.label}</span>
                        <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5">{TARGET_LABELS[a.target]}</span>
                        {a.showOnce&&<span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5">1x por user</span>}
                        {(a.benefits??[]).length>0&&<span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5">{a.benefits!.length} benefícios</span>}
                      </div>
                      <p className="text-white font-semibold mt-1 truncate">{a.title}</p>
                      <p className="text-gray-400 text-sm truncate">{a.body}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={()=>toggleAnnActive(a)} className={`p-2 transition-colors ${a.active?"text-green-400 hover:text-green-300":"text-gray-600 hover:text-gray-400"}`}>
                        {a.active?<Eye className="h-4 w-4"/>:<EyeOff className="h-4 w-4"/>}
                      </button>
                      <button onClick={()=>openEditAnn(a)} className="p-2 text-gray-500 hover:text-white transition-colors"><Pencil className="h-4 w-4"/></button>
                      <button onClick={()=>deleteAnn(a.id!)} className="p-2 text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4"/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── COUNTDOWNS TAB ── */}
      {tab==="countdowns" && (
        <>
          <div className="bg-gray-900/40 border border-gray-800 p-5 flex items-start gap-4">
            <Timer className="h-6 w-6 text-blue-400 shrink-0 mt-0.5"/>
            <div>
              <p className="text-white font-semibold">Como funciona</p>
              <p className="text-gray-400 text-sm mt-1">Os banners de contagem regressiva aparecem no topo do dashboard dos alunos com um contador ao vivo. Ideal para promoções com prazo, aulas ao vivo ou lançamentos.</p>
            </div>
          </div>

          {loadingCD?<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>
          :countdowns.length===0?(
            <div className="flex flex-col items-center justify-center py-20 bg-gray-900/40 text-center">
              <Timer className="h-12 w-12 text-gray-700 mb-3"/>
              <p className="text-gray-400 font-medium">Nenhum banner criado</p>
            </div>
          ):(
            <div className="space-y-3">
              {countdowns.map(b=>{
                const expired = new Date(b.endsAt) < new Date();
                return (
                  <div key={b.id} className={`flex items-center gap-4 p-5 border bg-gray-900/40 transition-all ${b.active&&!expired?"border-gray-800":"border-gray-800/40 opacity-60"}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-gray-800 border border-gray-700">
                      <Clock className="h-5 w-5 text-gray-300"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 border ${
                          b.color==="red"?"bg-red-500/10 text-red-400 border-red-500/30":
                          b.color==="yellow"?"bg-yellow-500/10 text-yellow-400 border-yellow-500/30":
                          b.color==="green"?"bg-green-500/10 text-green-400 border-green-500/30":
                          b.color==="purple"?"bg-purple-500/10 text-purple-400 border-purple-500/30":
                          "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }`}>{b.color}</span>
                        <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5">V{b.variant ?? 1}</span>
                        <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5">{TARGET_LABELS[b.target]}</span>
                        {expired&&<span className="text-xs text-red-400 border border-red-500/30 px-2 py-0.5">Expirado</span>}
                      </div>
                      <p className="text-white font-semibold mt-1">{b.label}</p>
                      <p className="text-gray-400 text-sm">Termina: {new Date(b.endsAt).toLocaleString("pt-AO")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={()=>toggleCdActive(b)} className={`p-2 transition-colors ${b.active?"text-green-400 hover:text-green-300":"text-gray-600 hover:text-gray-400"}`}>
                        {b.active?<Eye className="h-4 w-4"/>:<EyeOff className="h-4 w-4"/>}
                      </button>
                      <button onClick={()=>openEditCD(b)} className="p-2 text-gray-500 hover:text-white transition-colors"><Pencil className="h-4 w-4"/></button>
                      <button onClick={()=>deleteCD(b.id!)} className="p-2 text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4"/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── ANNOUNCEMENT MODAL ── */}
      {annModalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-gray-950/80 backdrop-blur-sm" onClick={()=>setAnnModalOpen(false)}/>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                <h2 className="text-lg font-bold text-white">{editingAnnId?"Editar Anúncio":"Novo Anúncio"}</h2>
                <button onClick={()=>setAnnModalOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"><X className="h-5 w-5"/></button>
              </div>
              <div className="p-6 space-y-6">
                {annError&&<div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"><AlertCircle className="h-4 w-4 shrink-0"/>{annError}</div>}

                {/* Tipo */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(TYPE_CONFIG) as [AnnouncementType, typeof TYPE_CONFIG[AnnouncementType]][]).map(([type,c])=>{
                      const Icon=c.icon;
                      return (
                        <button key={type} type="button" onClick={()=>setAnnForm(f=>({...f,type}))}
                          className={`flex items-center gap-3 px-4 py-3 border text-left transition-all ${annForm.type===type?`${c.bg}`:"border-gray-800 bg-gray-950/50 hover:border-gray-700"}`}>
                          <Icon className={`h-5 w-5 shrink-0 ${annForm.type===type?c.color:"text-gray-600"}`}/>
                          <span className={`text-sm font-medium ${annForm.type===type?c.color:"text-gray-400"}`}>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* IA */}
                <button type="button" onClick={handleGenerateAI} disabled={generatingAI}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-semibold text-sm transition-all disabled:opacity-50">
                  {generatingAI?<><Loader2 className="w-4 h-4 animate-spin"/>A gerar...</>:<><Sparkles className="w-4 h-4"/>Gerar anúncio completo com IA</>}
                </button>

                {/* Título */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Título *</label>
                  <input type="text" value={annForm.title} onChange={e=>setAnnForm(f=>({...f,title:e.target.value}))}
                    placeholder="Ex: 🔴 Aula ao Vivo começa em 10 minutos!"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"/>
                </div>

                {/* Corpo */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mensagem *</label>
                  <textarea rows={3} value={annForm.body} onChange={e=>setAnnForm(f=>({...f,body:e.target.value}))}
                    placeholder="Descreve o anúncio..."
                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all resize-none"/>
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Badge (opcional)</label>
                  <input type="text" value={annForm.badgeLabel??""} onChange={e=>setAnnForm(f=>({...f,badgeLabel:e.target.value}))}
                    placeholder="Ex: Oferta por 24h · Poupa 40%"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"/>
                </div>

                {/* Imagem */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Imagem (opcional)</label>
                  <div onClick={()=>!imageUploading&&imageInputRef.current?.click()}
                    className="relative w-full h-40 border border-dashed border-gray-700 hover:border-blue-500/50 cursor-pointer overflow-hidden bg-gray-950 group transition-colors">
                    {imagePreview?(
                      <>
                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-gray-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={()=>imageInputRef.current?.click()}>
                          <ImagePlus className="h-8 w-8 text-white"/>
                        </div>
                        <button type="button" onClick={e=>{e.stopPropagation();setImagePreview("");setAnnForm(f=>({...f,imageUrl:""}));}}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center bg-gray-900/80 border border-gray-700 text-gray-300 hover:text-white z-10">
                          <X className="h-3.5 w-3.5"/>
                        </button>
                      </>
                    ):(
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500 group-hover:text-blue-400 transition-colors">
                        <ImagePlus className="h-10 w-10"/><span className="text-sm font-medium">Clique para carregar</span><span className="text-xs">PNG, JPG, WEBP</span>
                      </div>
                    )}
                    {imageUploading&&<div className="absolute inset-0 bg-gray-950/70 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-400"/></div>}
                  </div>
                  <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange}/>
                  {annForm.imageUrl&&!imageUploading&&<p className="mt-2 text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/>Upload concluído</p>}
                </div>

                {/* CTA */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Texto do Botão</label>
                    <input type="text" value={annForm.ctaLabel??""} onChange={e=>setAnnForm(f=>({...f,ctaLabel:e.target.value}))}
                      placeholder="Ex: Entrar na Aula"
                      className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">URL do Botão</label>
                    <input type="text" value={annForm.ctaUrl??""} onChange={e=>setAnnForm(f=>({...f,ctaUrl:e.target.value}))}
                      placeholder="/dashboard/courses ou https://..."
                      className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"/>
                  </div>
                </div>

                {/* Target + Expiração */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mostrar para</label>
                    <select value={annForm.target} onChange={e=>setAnnForm(f=>({...f,target:e.target.value as AnnouncementTarget}))}
                      className="w-full bg-gray-950 border border-gray-800 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                      {(Object.entries(TARGET_LABELS) as [AnnouncementTarget,string][]).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expira em</label>
                    <input type="date" value={annForm.expiresAt??""} onChange={e=>setAnnForm(f=>({...f,expiresAt:e.target.value}))}
                      className="w-full bg-gray-950 border border-gray-800 py-2.5 px-3 text-white text-sm focus:outline-none transition-all"/>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-col gap-3">
                  {[{key:"active",label:"Anúncio ativo",desc:"Visível para os alunos agora"},{key:"showOnce",label:"Mostrar apenas uma vez",desc:"Cada aluno vê só na primeira sessão"}].map(({key,label,desc})=>(
                    <button key={key} type="button" onClick={()=>setAnnForm(f=>({...f,[key]:!f[key as keyof typeof f]}))}
                      className={`flex items-center gap-4 px-4 py-3 border text-left transition-all ${(annForm[key as keyof typeof annForm] as boolean)?"border-blue-500/40 bg-blue-500/10":"border-gray-800 bg-gray-950/50 hover:border-gray-700"}`}>
                      <div className={`h-5 w-9 rounded-full transition-colors relative shrink-0 ${(annForm[key as keyof typeof annForm] as boolean)?"bg-blue-500":"bg-gray-700"}`}>
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${(annForm[key as keyof typeof annForm] as boolean)?"translate-x-4":"translate-x-0.5"}`}/>
                      </div>
                      <div><p className="text-sm font-medium text-white">{label}</p><p className="text-xs text-gray-500">{desc}</p></div>
                    </button>
                  ))}
                </div>

                {/* Benefits com icon picker */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Benefícios / Features</label>
                    <button type="button" onClick={()=>setAnnForm(f=>({...f,benefits:[...(f.benefits??[]),{icon:"CheckCircle2",title:"",desc:""}]}))}
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      <Plus className="h-3.5 w-3.5"/>Adicionar
                    </button>
                  </div>
                  {(annForm.benefits??[]).length===0&&<p className="text-xs text-gray-600 italic">Nenhum benefício ainda.</p>}
                  <div className="space-y-2">
                    {(annForm.benefits??[]).map((b,i)=>(
                      <div key={i} className="flex items-start gap-2 bg-gray-950/60 border border-gray-800 p-3">
                        {/* Icon picker button */}
                        <div className="relative shrink-0">
                          <button type="button" onClick={()=>setIconPickerIdx(iconPickerIdx===i?null:i)}
                            className="flex h-9 w-9 items-center justify-center bg-gray-800 border border-gray-700 hover:border-blue-500/50 text-gray-300 hover:text-white transition-colors">
                            {getIcon(b.icon,"h-4 w-4") ?? <Plus className="h-4 w-4"/>}
                          </button>
                          {iconPickerIdx===i&&(
                            <IconPicker value={b.icon} onChange={name=>{const arr=[...(annForm.benefits??[])];arr[i]={...arr[i],icon:name};setAnnForm(f=>({...f,benefits:arr}));}} onClose={()=>setIconPickerIdx(null)}/>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <input type="text" value={b.title} placeholder="Título do benefício"
                            onChange={e=>{const arr=[...(annForm.benefits??[])];arr[i]={...arr[i],title:e.target.value};setAnnForm(f=>({...f,benefits:arr}));}}
                            className="w-full bg-gray-900 border border-gray-800 py-1.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none"/>
                          <input type="text" value={b.desc??""} placeholder="Descrição curta (opcional)"
                            onChange={e=>{const arr=[...(annForm.benefits??[])];arr[i]={...arr[i],desc:e.target.value};setAnnForm(f=>({...f,benefits:arr}));}}
                            className="w-full bg-gray-900 border border-gray-800 py-1.5 px-3 text-gray-400 placeholder-gray-600 text-xs focus:outline-none"/>
                        </div>
                        <button type="button" onClick={()=>setAnnForm(f=>({...f,benefits:(f.benefits??[]).filter((_,j)=>j!==i)}))}
                          className="p-1.5 text-gray-600 hover:text-red-400 transition-colors shrink-0"><Trash2 className="h-3.5 w-3.5"/></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview toggle */}
                <button type="button" onClick={()=>setPreviewOpen(!previewOpen)}
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  {previewOpen?<ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>}
                  {previewOpen?"Ocultar":"Ver"} pré-visualização
                </button>
                {previewOpen&&(
                  <div className="border border-gray-700 bg-gray-950 p-4">
                    <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-bold">Pré-visualização</p>
                    <AnnouncementModal announcement={{...annForm,id:"preview"}} onClose={()=>{}} preview/>
                  </div>
                )}
              </div>
              <div className="flex gap-3 px-6 py-5 border-t border-gray-800 sticky bottom-0 bg-gray-900">
                <button onClick={()=>setAnnModalOpen(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors">Cancelar</button>
                <button onClick={handleSaveAnn} disabled={savingAnn||imageUploading}
                  className="flex flex-1 items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors disabled:opacity-60">
                  {savingAnn?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}
                  {editingAnnId?"Atualizar":"Criar Anúncio"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── COUNTDOWN SIDEPANEL ── */}
      {cdModalOpen&&(
        <>
          <div className="fixed inset-0 z-40 bg-gray-950/80 backdrop-blur-sm" onClick={()=>setCdModalOpen(false)}/>
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg shadow-2xl translate-x-0 transition-transform">
            <div className="h-full bg-gray-900 border-l border-gray-800 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800 shrink-0">
                <h2 className="text-lg font-bold text-white">{editingCdId?"Editar Banner":"Novo Banner de Contagem"}</h2>
                <button onClick={()=>setCdModalOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"><X className="h-5 w-5"/></button>
              </div>

              {/* Scrollable body — no visible scrollbar */}
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="p-6 space-y-5">
                  {cdError&&<div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"><AlertCircle className="h-4 w-4 shrink-0"/>{cdError}</div>}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Texto do Banner *</label>
                    <input type="text" value={cdForm.label} onChange={e=>setCdForm(f=>({...f,label:e.target.value}))}
                      placeholder="Ex: Promoção termina em · Aula ao vivo começa em"
                      className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"/>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Data e Hora de Fim *</label>
                    <input type="datetime-local" value={cdForm.endsAt} onChange={e=>setCdForm(f=>({...f,endsAt:e.target.value}))}
                      className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white text-sm focus:outline-none transition-all"/>
                  </div>

                  {/* Imagem (variante 6) */}
                  {cdForm.variant === 6 && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Imagem do Banner</label>
                      <div onClick={()=>!cdImageUploading&&cdImageInputRef.current?.click()}
                        className="relative w-full h-36 border border-dashed border-gray-700 hover:border-blue-500/50 cursor-pointer overflow-hidden bg-gray-950 group transition-colors">
                        {cdImagePreview?(
                          <>
                            <img src={cdImagePreview} alt="preview" className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-gray-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={()=>cdImageInputRef.current?.click()}>
                              <ImagePlus className="h-8 w-8 text-white"/>
                            </div>
                            <button type="button" onClick={e=>{e.stopPropagation();setCdImagePreview("");setCdForm(f=>({...f,imageUrl:""}));}}
                              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center bg-gray-900/80 border border-gray-700 text-gray-300 hover:text-white z-10">
                              <X className="h-3.5 w-3.5"/>
                            </button>
                          </>
                        ):(
                          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500 group-hover:text-blue-400 transition-colors">
                            <ImagePlus className="h-10 w-10"/><span className="text-sm font-medium">Clique para carregar</span><span className="text-xs">PNG, JPG, WEBP</span>
                          </div>
                        )}
                        {cdImageUploading&&<div className="absolute inset-0 bg-gray-950/70 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-400"/></div>}
                      </div>
                      <input ref={cdImageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCdImageChange}/>
                      {cdForm.imageUrl&&!cdImageUploading&&<p className="mt-2 text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/>Upload concluído</p>}
                      <div className="mt-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Texto do Badge</label>
                        <input type="text" value={cdForm.badgeLabel ?? ""} onChange={e => setCdForm(f => ({ ...f, badgeLabel: e.target.value }))}
                          placeholder="Ex: 82% OFF · Promoção · Limitado"
                          className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"/>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Texto do Botão</label>
                      <input type="text" value={cdForm.ctaLabel??""} onChange={e=>setCdForm(f=>({...f,ctaLabel:e.target.value}))}
                        placeholder="Ex: Ver Promoção"
                        className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">URL do Botão</label>
                      <input type="text" value={cdForm.ctaUrl??""} onChange={e=>setCdForm(f=>({...f,ctaUrl:e.target.value}))}
                        placeholder="/dashboard/finances"
                        className="w-full bg-gray-950 border border-gray-800 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"/>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cor do Banner</label>
                    <div className="flex gap-2">
                      {COUNTDOWN_COLORS.map(color=>(
                      <button key={color} type="button" onClick={()=>setCdForm(f=>({...f,color}))}
                        className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all ${cdForm.color===color?"border-white/30 scale-105":"border-gray-800 opacity-60 hover:opacity-100"} ${
                          color==="red"?"bg-red-600 text-white":color==="yellow"?"bg-yellow-500 text-gray-900":
                          color==="blue"?"bg-blue-600 text-white":color==="green"?"bg-green-600 text-white":"bg-purple-600 text-white"
                        }`}>{color}</button>
                      ))}
                    </div>
                  </div>

                  {/* Variante */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Variante de Visual</label>
                    <div className="grid grid-cols-1 gap-2">
                      {([1,2,3,4,5,6] as CountdownVariant[]).map((v) => {
                        const info = VARIANT_LABELS[v];
                        const isSelected = cdForm.variant === v;
                        return (
                          <button key={v} type="button" onClick={() => setCdForm(f=>({...f, variant: v}))}
                            className={`flex items-center gap-3 px-4 py-3 border text-left transition-all ${
                              isSelected ? "border-blue-500/40 bg-blue-500/10" : "border-gray-800 bg-gray-950/50 hover:border-gray-700"
                            }`}>
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold rounded-full ${
                              isSelected ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"
                            }`}>{v}</div>
                            <div>
                              <p className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-400"}`}>{info.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{info.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target + Ativo */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mostrar para</label>
                      <select value={cdForm.target} onChange={e=>setCdForm(f=>({...f,target:e.target.value as AnnouncementTarget}))}
                        className="w-full bg-gray-950 border border-gray-800 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                        {(Object.entries(TARGET_LABELS) as [AnnouncementTarget,string][]).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button type="button" onClick={()=>setCdForm(f=>({...f,active:!f.active}))}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 border transition-all ${cdForm.active?"border-blue-500/40 bg-blue-500/10":"border-gray-800 bg-gray-950/50"}`}>
                        <div className={`h-5 w-9 rounded-full transition-colors relative shrink-0 ${cdForm.active?"bg-blue-500":"bg-gray-700"}`}>
                          <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${cdForm.active?"translate-x-4":"translate-x-0.5"}`}/>
                        </div>
                        <span className="text-sm text-white font-medium">Ativo</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-5 border-t border-gray-800 shrink-0">
                <button onClick={()=>setCdModalOpen(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors">Cancelar</button>
                <button onClick={handleSaveCD} disabled={savingCD}
                  className="flex flex-1 items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors disabled:opacity-60">
                  {savingCD?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}
                  {editingCdId?"Atualizar":"Criar Banner"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── AnnouncementModal — reutilizado no dashboard ──────────
export function AnnouncementModal({ announcement, onClose, preview=false }:
  { announcement: Announcement; onClose: ()=>void; preview?: boolean }) {
  const cfg = TYPE_CONFIG[announcement.type];
  const TypeIcon = cfg.icon;
  const hasBenefits = (announcement.benefits??[]).length > 0;
  const hasImage = !!announcement.imageUrl;

  return (
    <div style={{ backgroundColor: 'var(--popup-bg)' }} className={`relative border ${cfg.bg} overflow-hidden rounded-2xl w-full max-w-3xl mx-auto`}>

      {/* Layout rico: imagem lateral + benefícios */}
      {hasImage && hasBenefits ? (
        <div className="flex min-h-[480px]">
          {/* Left */}
          <div className="flex-1 p-10 flex flex-col gap-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider border self-start ${cfg.bg} ${cfg.color}`}>
              <TypeIcon className="h-4 w-4"/>
              {announcement.badgeLabel || cfg.label}
              {announcement.type==="live"&&<span className="flex h-2 w-2 relative ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/></span>}
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white leading-tight">{announcement.title||"Título"}</h3>
              <p className="mt-2 text-[#a8a8b3] text-base leading-relaxed">{announcement.body}</p>
            </div>
            <ul className="space-y-4 flex-1">
              {(announcement.benefits??[]).map((b,i)=>{
                const BIcon = getLucideIcon(b.icon);
                return (
                  <li key={i} className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${cfg.bg}`}>
                      {BIcon?<BIcon className={`h-5 w-5 ${cfg.color}`}/>:null}
                    </div>
                    <div><p className="text-base font-semibold text-white">{b.title}</p>{b.desc&&<p className="text-sm text-[#7c7c8a] mt-0.5">{b.desc}</p>}</div>
                  </li>
                );
              })}
            </ul>
            {announcement.ctaLabel&&(
              preview
                ? <div className={`flex items-center justify-center py-4 font-bold text-base border ${cfg.bg} ${cfg.color}`}>{announcement.ctaLabel}</div>
                  : <a href={announcement.ctaUrl||"#"} target="_blank" rel="noopener noreferrer" onClick={onClose} className={`flex items-center justify-center py-4 font-bold text-base transition-colors ${cfg.accent}`}>{announcement.ctaLabel}</a>
            )}
          </div>
          {/* Right — imagem */}
          <div className="relative w-72 shrink-0 overflow-hidden">
            <img src={announcement.imageUrl} alt={announcement.title} className="absolute inset-0 w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent"/>
          </div>
        </div>

      ) : (
        /* Layout simples */
        <>
          {hasImage&&(
            <div className="relative h-64 overflow-hidden">
              <img src={announcement.imageUrl} alt={announcement.title} className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"/>
            </div>
          )}
          <div className="p-10 space-y-5">
            <div className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color}`}>
              <TypeIcon className="h-4 w-4"/>
              {announcement.badgeLabel||cfg.label}
              {announcement.type==="live"&&<span className="flex h-2 w-2 relative ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/></span>}
            </div>
            <h3 className="text-3xl font-bold text-white leading-tight">{announcement.title||"Título"}</h3>
            <p className="text-[#c4c4cc] text-base leading-relaxed">{announcement.body||"Mensagem aqui."}</p>
            {hasBenefits&&(
              <ul className="space-y-4 pt-2">
                {(announcement.benefits??[]).map((b,i)=>{
                  const BIcon = getLucideIcon(b.icon);
                  return (
                    <li key={i} className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${cfg.bg}`}>
                        {BIcon?<BIcon className={`h-5 w-5 ${cfg.color}`}/>:null}
                      </div>
                      <div><p className="text-base font-semibold text-white">{b.title}</p>{b.desc&&<p className="text-sm text-[#7c7c8a] mt-0.5">{b.desc}</p>}</div>
                    </li>
                  );
                })}
              </ul>
            )}
            {announcement.ctaLabel&&(
              <div className="pt-2">
                {preview
                  ? <div className={`flex items-center justify-center py-4 font-bold text-base border ${cfg.bg} ${cfg.color}`}>{announcement.ctaLabel}</div>
                : <a href={announcement.ctaUrl||"#"} target="_blank" rel="noopener noreferrer" onClick={onClose} className={`flex items-center justify-center py-4 font-bold text-base transition-colors ${cfg.accent}`}>{announcement.ctaLabel}</a>
                }
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
