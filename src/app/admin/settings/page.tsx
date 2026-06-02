"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  Save, Loader2, CheckCircle2, AlertCircle, Plus,
  CreditCard, Share2, Mail, Phone, MapPin, Globe,
  MessageCircle, Music2, Crown, Zap, X, Link,
} from "lucide-react";
import type { PlatformSettings } from "@/types/settings";

const DEFAULT_SETTINGS: PlatformSettings = {
  plans: {
    smart: { price: 0, label: "Plano Smart", description: "", features: [] },
    golden: { price: 0, label: "Plano Golden", description: "", features: [] },
  },
  paymentMethods: {
    bankTransfer: { enabled: false, bankName: "", iban: "", accountHolder: "", reference: "" },
    multicaixa: { enabled: false, entity: "", reference: "" },
    paypal: { enabled: false, email: "", clientId: "" },
    stripe: { enabled: false, publicKey: "" },
  },
  socials: { instagram: "", youtube: "", facebook: "", twitter: "", linkedin: "", discord: "", whatsapp: "", tiktok: "" },
  contact: { email: "", phone: "", address: "", supportEmail: "" },
  meta: { description: "", keywords: "" },
};

type TabId = "plans" | "payments" | "socials" | "contact" | "meta";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "plans", label: "Planos & Preços", icon: Crown },
  { id: "payments", label: "Pagamentos", icon: CreditCard },
  { id: "socials", label: "Redes Sociais", icon: Share2 },
  { id: "contact", label: "Contacto", icon: Mail },
  { id: "meta", label: "SEO / Meta", icon: Globe },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("plans");

  useEffect(() => {
    getDoc(doc(db, "settings", "platform")).then((snap) => {
      if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() } as PlatformSettings);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      await setDoc(doc(db, "settings", "platform"), { ...settings, updatedAt: serverTimestamp() });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { setError("Erro ao guardar. Tenta novamente."); }
    finally { setSaving(false); }
  };

  const set = (path: string, value: unknown) => {
    setSettings((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const addFeature = (plan: "smart" | "golden") => {
    setSettings((prev) => ({
      ...prev,
      plans: { ...prev.plans, [plan]: { ...prev.plans[plan], features: [...prev.plans[plan].features, ""] } },
    }));
  };

  const updateFeature = (plan: "smart" | "golden", i: number, v: string) => {
    setSettings((prev) => {
      const features = [...prev.plans[plan].features];
      features[i] = v;
      return { ...prev, plans: { ...prev.plans, [plan]: { ...prev.plans[plan], features } } };
    });
  };

  const removeFeature = (plan: "smart" | "golden", i: number) => {
    setSettings((prev) => ({
      ...prev,
      plans: { ...prev.plans, [plan]: { ...prev.plans[plan], features: prev.plans[plan].features.filter((_, j) => j !== i) } },
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-purple" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
          <p className="mt-1 text-gray-400">Planos, pagamentos, redes sociais e contacto</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-2.5 font-semibold transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "A guardar..." : saved ? "Guardado!" : "Guardar"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === id ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* ── PLANS ── */}
      {tab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(["smart", "golden"] as const).map((plan) => (
            <div key={plan} className={`bg-gray-900/40 border p-6 space-y-5 ${plan === "golden" ? "border-yellow-500/20" : "border-green-500/20"}`}>
              <div className="flex items-center gap-3">
                {plan === "golden" ? <Crown className="h-6 w-6 text-yellow-400" /> : <Zap className="h-6 w-6 text-green-400" />}
                <h3 className={`text-lg font-bold ${plan === "golden" ? "text-yellow-400" : "text-green-400"}`}>
                  {plan === "golden" ? "Plano Golden" : "Plano Smart"}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preço Mensal (Kz)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-gray-500">Kz</span>
                  <input type="number" min="0" value={settings.plans[plan].price || ""}
                    onChange={(e) => set(`plans.${plan}.price`, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 pl-10 pr-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descrição</label>
                <textarea rows={2} value={settings.plans[plan].description}
                  onChange={(e) => set(`plans.${plan}.description`, e.target.value)}
                  placeholder="Descreve o plano..."
                  className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all resize-none" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Funcionalidades</label>
                  <button onClick={() => addFeature(plan)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {settings.plans[plan].features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={f} onChange={(e) => updateFeature(plan, i, e.target.value)}
                        placeholder="Ex: Acesso a todos os cursos Smart"
                        className="flex-1 bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                      <button onClick={() => removeFeature(plan, i)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {settings.plans[plan].features.length === 0 && (
                    <p className="text-xs text-gray-600 italic">Nenhuma funcionalidade. Clica em &quot;Adicionar&quot;.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {tab === "payments" && (
        <div className="space-y-6">
          {/* Transferência Bancária */}
          <div className="bg-gray-900/40 border border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-400" /> Transferência Bancária</h3>
              <Toggle value={settings.paymentMethods.bankTransfer.enabled} onChange={(v) => set("paymentMethods.bankTransfer.enabled", v)} />
            </div>
            {settings.paymentMethods.bankTransfer.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {([
                  { key: "bankName", label: "Nome do Banco", placeholder: "Ex: BAI, BFA, BIC..." },
                  { key: "accountHolder", label: "Titular da Conta", placeholder: "Nome completo" },
                  { key: "iban", label: "IBAN / Nº de Conta", placeholder: "AO06..." },
                  { key: "reference", label: "Referência / Instrução", placeholder: "Ex: Indicar nome e plano" },
                ] as const).map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
                    <input type="text" value={settings.paymentMethods.bankTransfer[key]}
                      onChange={(e) => set(`paymentMethods.bankTransfer.${key}`, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Multicaixa */}
          <div className="bg-gray-900/40 border border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><CreditCard className="h-5 w-5 text-green-400" /> Multicaixa Express</h3>
              <Toggle value={settings.paymentMethods.multicaixa.enabled} onChange={(v) => set("paymentMethods.multicaixa.enabled", v)} />
            </div>
            {settings.paymentMethods.multicaixa.enabled && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                {([
                  { key: "entity", label: "Entidade", placeholder: "Nº da entidade" },
                  { key: "reference", label: "Referência", placeholder: "Referência de pagamento" },
                ] as const).map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
                    <input type="text" value={settings.paymentMethods.multicaixa[key]}
                      onChange={(e) => set(`paymentMethods.multicaixa.${key}`, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PayPal */}
          <div className="bg-gray-900/40 border border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><Globe className="h-5 w-5 text-blue-500" /> PayPal</h3>
              <Toggle value={settings.paymentMethods.paypal.enabled} onChange={(v) => set("paymentMethods.paypal.enabled", v)} />
            </div>
            {settings.paymentMethods.paypal.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email PayPal</label>
                  <input type="email" value={settings.paymentMethods.paypal.email}
                    onChange={(e) => set("paymentMethods.paypal.email", e.target.value)}
                    placeholder="pagamentos@exemplo.com"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client ID (copia do <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">PayPal Developer Dashboard</a>)</label>
                  <input type="text" value={settings.paymentMethods.paypal.clientId}
                    onChange={(e) => set("paymentMethods.paypal.clientId", e.target.value)}
                    placeholder="Axxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                </div>
              </div>
            )}
          </div>

          {/* Stripe */}
          <div className="bg-gray-900/40 border border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><CreditCard className="h-5 w-5 text-purple-400" /> Stripe</h3>
              <Toggle value={settings.paymentMethods.stripe.enabled} onChange={(v) => set("paymentMethods.stripe.enabled", v)} />
            </div>
            {settings.paymentMethods.stripe.enabled && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Chave Pública (pk_...)</label>
                <input type="text" value={settings.paymentMethods.stripe.publicKey}
                  onChange={(e) => set("paymentMethods.stripe.publicKey", e.target.value)}
                  placeholder="pk_live_..."
                  className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SOCIALS ── */}
      {tab === "socials" && (
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {([
              { key: "instagram", label: "Instagram", icon: Link, placeholder: "https://instagram.com/..." },
              { key: "youtube", label: "YouTube", icon: Link, placeholder: "https://youtube.com/..." },
              { key: "facebook", label: "Facebook", icon: Link, placeholder: "https://facebook.com/..." },
              { key: "twitter", label: "Twitter / X", icon: Link, placeholder: "https://twitter.com/..." },
              { key: "linkedin", label: "LinkedIn", icon: Link, placeholder: "https://linkedin.com/..." },
              { key: "discord", label: "Discord", icon: MessageCircle, placeholder: "https://discord.gg/..." },
              { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "https://wa.me/..." },
              { key: "tiktok", label: "TikTok", icon: Music2, placeholder: "https://tiktok.com/..." },
            ] as const).map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key}>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <Icon className="h-3.5 w-3.5" />{label}
                </label>
                <input type="url" value={settings.socials[key]}
                  onChange={(e) => set(`socials.${key}`, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTACT ── */}
      {tab === "contact" && (
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {([
              { key: "email", label: "Email Geral", icon: Mail, placeholder: "info@netsulwel.com", type: "email" },
              { key: "supportEmail", label: "Email de Suporte", icon: Mail, placeholder: "suporte@netsulwel.com", type: "email" },
              { key: "phone", label: "Telefone / WhatsApp", icon: Phone, placeholder: "+244 9XX XXX XXX", type: "tel" },
              { key: "address", label: "Endereço", icon: MapPin, placeholder: "Luanda, Angola", type: "text" },
            ] as const).map(({ key, label, icon: Icon, placeholder, type }) => (
              <div key={key}>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <Icon className="h-3.5 w-3.5" />{label}
                </label>
                <input type={type} value={settings.contact[key]}
                  onChange={(e) => set(`contact.${key}`, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── META ── */}
      {tab === "meta" && (
        <div className="bg-gray-900/40 border border-gray-800 p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descrição do Site (meta description)</label>
            <textarea rows={3} value={settings.meta.description}
              onChange={(e) => set("meta.description", e.target.value)}
              placeholder="Descrição que aparece nos motores de busca..."
              className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all resize-none" />
            <p className="text-xs text-gray-600 mt-1">{settings.meta.description.length}/160 caracteres recomendados</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Keywords (separadas por vírgula)</label>
            <input type="text" value={settings.meta.keywords}
              onChange={(e) => set("meta.keywords", e.target.value)}
              placeholder="tecnologia, finanças, investimentos, cursos online, angola"
              className="w-full bg-gray-950 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Toggle component ──────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`h-6 w-11 rounded-full transition-colors relative shrink-0 ${value ? "bg-blue-500" : "bg-gray-700"}`}>
      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
