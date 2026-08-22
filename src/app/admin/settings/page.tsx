"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  Save, Loader2, AlertCircle,
  CreditCard, Share2, Mail, Phone, MapPin, Globe,
  Percent, Link2,
} from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { PlatformSettings } from "@/types/settings";

// ── Constants ─────────────────────────────────────────────────
const DEFAULT_SETTINGS: PlatformSettings = {
  paymentMethods: {
    bankTransfer: { enabled: false, bankName: "", iban: "", accountHolder: "", reference: "" },
    multicaixa:   { enabled: false, entity: "", reference: "" },
    paypal:       { enabled: false, email: "", clientId: "" },
    stripe:       { enabled: false, publicKey: "" },
  },
  socials: { instagram: "", youtube: "", facebook: "", twitter: "", linkedin: "", discord: "", whatsapp: "", tiktok: "" },
  contact: { email: "", phone: "", address: "", supportEmail: "" },
  meta:    { description: "", keywords: "" },
  fees:    { defaultCourseFee: 0, defaultVideoFee: 0 },
};

type TabId = "payments" | "fees" | "socials" | "contact" | "meta";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "payments", label: "Pagamentos",  icon: CreditCard },
  { id: "fees",     label: "Taxas",       icon: Percent    },
  { id: "socials",  label: "Sociais",     icon: Share2     },
  { id: "contact",  label: "Contacto",    icon: Mail       },
  { id: "meta",     label: "SEO",         icon: Globe      },
];

// ── Shared input classes ──────────────────────────────────────
const inputCls =
  "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 placeholder-gray-700 focus:border-purple/30 focus:outline-none transition-colors";

// ── Toggle (sharp, no rounded-full) ──────────────────────────
function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={value} aria-label={label}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center border transition-colors ${
        value ? "bg-purple border-purple/60" : "bg-gray-800 border-gray-700"
      }`}
    >
      <span className={`inline-block h-3 w-3 bg-white transition-transform ${value ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  );
}

// ── Field label ───────────────────────────────────────────────
function FL({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">{children}</p>;
}

// ── Section card ──────────────────────────────────────────────
function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className={`border bg-gray-900 p-5 space-y-4 ${accent ?? "border-gray-800"}`}>
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [tab,      setTab]      = useState<TabId>("payments");

  // ── Load ─────────────────────────────────────────────────
  useEffect(() => {
    getDoc(doc(db, "settings", "platform"))
      .then(snap => {
        if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as PlatformSettings) });
      })
      .catch(err => {
        logger.error("Settings: failed to load", err);
        setError("Não foi possível carregar as configurações.");
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Generic deep setter ───────────────────────────────────
  const set = useCallback((path: string, value: unknown) => {
    setSettings(prev => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let obj: any = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  // ── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const clean = JSON.parse(JSON.stringify(settings, (_, v) =>
        typeof v === "string" ? v.trim() : v
      )) as PlatformSettings;
      await setDoc(doc(db, "settings", "platform"), { ...clean, updatedAt: serverTimestamp() });
      toast.success("Configurações guardadas com sucesso.");
    } catch (err) {
      logger.error("Settings: failed to save", err);
      setError("Erro ao guardar. Tenta novamente.");
      toast.error("Erro ao guardar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
    </div>
  );

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60 mb-2">
            // configurações
          </p>
          <h1 className="text-2xl font-bold text-gray-100">Configurações</h1>
          <p className="mt-1 text-sm text-gray-600">Pagamentos, taxas, redes sociais, contacto e SEO.</p>
        </div>
        <button
          onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 bg-purple px-5 py-2.5 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-purple-600 disabled:opacity-40 transition-all shrink-0"
        >
          {saving
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Save className="h-3 w-3" />
          }
          {saving ? "A guardar..." : "Guardar tudo"}
        </button>
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-start gap-3 border border-red-500/20 bg-red-500/8 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400/70" strokeWidth={1.5} />
          <p className="text-sm text-red-400/80">{error}</p>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-800 overflow-x-auto gap-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 font-mono text-[13px] uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
              tab === id
                ? "border-purple text-purple/80"
                : "border-transparent text-gray-600 hover:text-gray-400"
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: PAGAMENTOS                                       */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "payments" && (
        <div className="space-y-4">

          {/* Transferência Bancária */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-400/70" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-gray-200">Transferência Bancária</p>
              </div>
              <Toggle
                value={settings.paymentMethods.bankTransfer.enabled}
                onChange={v => set("paymentMethods.bankTransfer.enabled", v)}
                label="Activar transferência bancária"
              />
            </div>
            {settings.paymentMethods.bankTransfer.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                {([
                  { key: "bankName",       label: "Banco",               placeholder: "BAI, BFA, BIC..." },
                  { key: "accountHolder",  label: "Titular",             placeholder: "Nome completo" },
                  { key: "iban",           label: "IBAN / Nº de conta",  placeholder: "AO06..." },
                  { key: "reference",      label: "Instrução",           placeholder: "Indicar nome e curso" },
                ] as const).map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <FL>// {label}</FL>
                    <input type="text" value={settings.paymentMethods.bankTransfer[key]}
                      onChange={e => set(`paymentMethods.bankTransfer.${key}`, e.target.value)}
                      placeholder={placeholder} className={inputCls} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Multicaixa */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green/70" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-gray-200">Multicaixa Express</p>
              </div>
              <Toggle
                value={settings.paymentMethods.multicaixa.enabled}
                onChange={v => set("paymentMethods.multicaixa.enabled", v)}
                label="Activar Multicaixa"
              />
            </div>
            {settings.paymentMethods.multicaixa.enabled && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                {([
                  { key: "entity",    label: "Entidade",    placeholder: "Nº da entidade" },
                  { key: "reference", label: "Referência",  placeholder: "Referência de pagamento" },
                ] as const).map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <FL>// {label}</FL>
                    <input type="text" value={settings.paymentMethods.multicaixa[key]}
                      onChange={e => set(`paymentMethods.multicaixa.${key}`, e.target.value)}
                      placeholder={placeholder} className={inputCls} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* PayPal */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-400/70" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-gray-200">PayPal</p>
              </div>
              <Toggle
                value={settings.paymentMethods.paypal.enabled}
                onChange={v => set("paymentMethods.paypal.enabled", v)}
                label="Activar PayPal"
              />
            </div>
            {settings.paymentMethods.paypal.enabled && (
              <div className="space-y-4 pt-2 border-t border-gray-800">
                <div>
                  <FL>// email paypal</FL>
                  <input type="email" value={settings.paymentMethods.paypal.email}
                    onChange={e => set("paymentMethods.paypal.email", e.target.value)}
                    placeholder="pagamentos@exemplo.com" className={inputCls} />
                </div>
                <div>
                  <FL>// client id &nbsp;<a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noopener noreferrer" className="text-purple/60 hover:text-purple/80 transition-colors">(PayPal Developer Dashboard ↗)</a></FL>
                  <input type="text" value={settings.paymentMethods.paypal.clientId}
                    onChange={e => set("paymentMethods.paypal.clientId", e.target.value)}
                    placeholder="Axxxxxxxxxxxxxxxxxxxxxxxxxxx" className={inputCls} />
                </div>
              </div>
            )}
          </Card>

          {/* Stripe */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple/70" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-gray-200">Stripe</p>
              </div>
              <Toggle
                value={settings.paymentMethods.stripe.enabled}
                onChange={v => set("paymentMethods.stripe.enabled", v)}
                label="Activar Stripe"
              />
            </div>
            {settings.paymentMethods.stripe.enabled && (
              <div className="pt-2 border-t border-gray-800">
                <FL>// chave pública (pk_...)</FL>
                <input type="text" value={settings.paymentMethods.stripe.publicKey}
                  onChange={e => set("paymentMethods.stripe.publicKey", e.target.value)}
                  placeholder="pk_live_..." className={inputCls} />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: TAXAS                                            */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "fees" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
              <Percent className="h-4 w-4 text-purple/70" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold text-gray-200">Taxa Padrão por Curso</p>
                <p className="font-mono text-[13px] text-gray-600 mt-0.5">Percentagem deduzida do valor bruto de cada venda.</p>
              </div>
            </div>

            <div className="max-w-xs">
              <FL>// taxa padrão (%)</FL>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
                <input type="number" min="0" max="100" step="0.5"
                  value={settings.fees.defaultCourseFee || ""}
                  onChange={e => set("fees.defaultCourseFee", parseFloat(e.target.value) || 0)}
                  placeholder="0" className={`${inputCls} pl-9`} />
              </div>
              <p className="font-mono text-[13px] text-gray-700 mt-2">
                Ex: 10% → Kz 1.000 de venda = Kz 900 líquidos para o vendedor.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: REDES SOCIAIS                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "socials" && (
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {([
              { key: "instagram", label: "Instagram",   placeholder: "https://instagram.com/..." },
              { key: "youtube",   label: "YouTube",     placeholder: "https://youtube.com/..." },
              { key: "facebook",  label: "Facebook",    placeholder: "https://facebook.com/..." },
              { key: "twitter",   label: "Twitter / X", placeholder: "https://twitter.com/..." },
              { key: "linkedin",  label: "LinkedIn",    placeholder: "https://linkedin.com/..." },
              { key: "discord",   label: "Discord",     placeholder: "https://discord.gg/..." },
              { key: "whatsapp",  label: "WhatsApp",    placeholder: "https://wa.me/..." },
              { key: "tiktok",    label: "TikTok",      placeholder: "https://tiktok.com/@..." },
            ] as const).map(({ key, label, placeholder }) => (
              <div key={key}>
                <FL><span className="flex items-center gap-1.5"><Link2 className="h-3 w-3" strokeWidth={1.5} /> {label}</span></FL>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-700" strokeWidth={1.5} />
                  <input type="url" value={settings.socials[key]}
                    onChange={e => set(`socials.${key}`, e.target.value)}
                    placeholder={placeholder} className={`${inputCls} pl-9`} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: CONTACTO                                         */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "contact" && (
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {([
              { key: "email",        label: "Email Geral",          Icon: Mail,    type: "email", placeholder: "info@netsulwel.com"    },
              { key: "supportEmail", label: "Email de Suporte",     Icon: Mail,    type: "email", placeholder: "suporte@netsulwel.com" },
              { key: "phone",        label: "Telefone / WhatsApp",  Icon: Phone,   type: "tel",   placeholder: "+244 9XX XXX XXX"      },
              { key: "address",      label: "Endereço",             Icon: MapPin,  type: "text",  placeholder: "Luanda, Angola"        },
            ] as const).map(({ key, label, Icon, type, placeholder }) => (
              <div key={key}>
                <FL><span className="flex items-center gap-1.5"><Icon className="h-3 w-3" strokeWidth={1.5} /> {label}</span></FL>
                <input type={type} value={settings.contact[key]}
                  onChange={e => set(`contact.${key}`, e.target.value)}
                  placeholder={placeholder} className={inputCls} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: SEO / META                                       */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === "meta" && (
        <Card>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <FL>// descrição do site (meta description)</FL>
                <span className={`font-mono text-[13px] ${settings.meta.description.length > 160 ? "text-red-400/70" : "text-gray-700"}`}>
                  {settings.meta.description.length}/160
                </span>
              </div>
              <textarea
                rows={3} value={settings.meta.description}
                onChange={e => set("meta.description", e.target.value)}
                placeholder="Descrição que aparece nos motores de busca..."
                className={`${inputCls} resize-none`}
                maxLength={200}
              />
              <p className="font-mono text-[8px] text-gray-700 mt-1">
                Recomendado: até 160 caracteres para melhor visibilidade nos motores de busca.
              </p>
            </div>

            <div>
              <FL>// keywords (separadas por vírgula)</FL>
              <input type="text" value={settings.meta.keywords}
                onChange={e => set("meta.keywords", e.target.value)}
                placeholder="tecnologia, finanças, investimentos, cursos online, angola"
                className={inputCls} />
              <p className="font-mono text-[8px] text-gray-700 mt-1">
                Palavras-chave que descrevem a plataforma.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Guardar no fundo (atalho para páginas longas) ── */}
      <div className="flex justify-end pt-4 border-t border-gray-800">
        <button
          onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 bg-purple px-5 py-2.5 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-purple-600 disabled:opacity-40 transition-all"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {saving ? "A guardar..." : "Guardar tudo"}
        </button>
      </div>
    </div>
  );
}
