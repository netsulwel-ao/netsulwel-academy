"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  CreditCard, Crown, Zap, Lock, ArrowUpRight, Building2,
  Smartphone, Loader2, CheckCircle2, AlertCircle, Copy,
  ExternalLink, Banknote, Landmark,
} from "lucide-react";
import { toast } from "sonner";
import type { PlatformSettings } from "@/types/settings";

type PlanId = "smart" | "golden";

export default function DashboardFinancesPage() {
  const { user, plan: currentPlan, isAdmin } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "platform")).then((snap) => {
      if (snap.exists()) setSettings(snap.data() as PlatformSettings);
    }).catch(() => toast.error("Erro ao carregar métodos de pagamento."))
    .finally(() => setLoading(false));
  }, []);

  const plans = settings?.plans;
  const methods = settings?.paymentMethods;

  const activeMethods = methods ? [
    methods.bankTransfer.enabled && { id: "bankTransfer", label: "Transferência Bancária", icon: Building2, data: methods.bankTransfer },
    methods.multicaixa.enabled && { id: "multicaixa", label: "Multicaixa", icon: Smartphone, data: methods.multicaixa },
    methods.paypal.enabled && { id: "paypal", label: "PayPal", icon: CreditCard, data: methods.paypal },
    methods.stripe.enabled && { id: "stripe", label: "Stripe", icon: CreditCard, data: methods.stripe },
  ].filter(Boolean) as { id: string; label: string; icon: React.ElementType; data: Record<string, unknown> }[] : [];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !selectedMethod || !user || !plans) return;
    setSubmitting(true);
    try {
      const plan = plans[selectedPlan];
      await addDoc(collection(db, "sales"), {
        userId: user.uid,
        userName: user.displayName || "Aluno",
        userEmail: user.email || "",
        type: selectedPlan,
        amount: plan.price,
        paymentMethod: activeMethods.find((m) => m.id === selectedMethod)?.label || selectedMethod,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Pedido registado! O pagamento será confirmado em breve.");
      setSelectedPlan(null);
      setSelectedMethod(null);
    } catch {
      toast.error("Erro ao registar pedido. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const planPill = isAdmin ? (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold border bg-purple-500/15 text-purple-300 border-purple-500/25">
      <Crown className="h-3.5 w-3.5" /> Admin
    </span>
  ) : currentPlan === "golden" ? (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold border bg-yellow-500/15 text-yellow-300 border-yellow-500/25">
      <Crown className="h-3.5 w-3.5" /> Golden
    </span>
  ) : currentPlan === "smart" ? (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold border bg-green-500/15 text-green-300 border-green-500/25">
      <Zap className="h-3.5 w-3.5" /> Smart
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold border bg-gray-500/10 text-gray-300 border-gray-700/60">
      <Lock className="h-3.5 w-3.5" /> Grátis
    </span>
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <CreditCard className="h-6 w-6 text-blue-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-white">Finanças</h1>
          <p className="mt-1 text-gray-400">
            Planos, métodos de pagamento e histórico de compras.
          </p>
          <div className="mt-3">{planPill}</div>
        </div>
      </div>

      {/* Plans */}
      {plans && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Planos Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(["smart", "golden"] as PlanId[]).map((id) => {
              const plan = plans[id];
              const isCurrent = currentPlan === id;
              const selected = selectedPlan === id;
              return (
                <button
                  key={id}
                  onClick={() => { setSelectedPlan(selected ? null : id); setSelectedMethod(null); }}
                  disabled={isCurrent || isAdmin}
                  className={`text-left border p-6 transition-all ${
                    selected
                      ? "border-blue-500 bg-blue-500/10"
                      : isCurrent
                        ? "border-green-500/30 bg-green-500/5 opacity-60"
                        : "border-gray-800 bg-gray-900/40 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-3 ${id === "golden" ? "text-yellow-400" : "text-green-400"}`}>
                      {id === "golden" ? <Crown className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                      <span className="text-xl font-bold text-white">{plan.label}</span>
                    </div>
                    {isCurrent && <span className="text-xs font-bold text-green-400 border border-green-500/30 px-2 py-1">Atual</span>}
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <p className="text-3xl font-bold text-white mb-4">
                    {plan.price.toLocaleString("pt-AO")} <span className="text-lg text-gray-500 font-normal">Kz</span>
                  </p>
                  {plan.features.length > 0 && (
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Payment Methods */}
      {selectedPlan && activeMethods.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Método de Pagamento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {activeMethods.map((method) => {
              const Icon = method.icon;
              const selected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(selected ? null : method.id)}
                  className={`flex items-center gap-3 border p-4 transition-all ${
                    selected ? "border-blue-500 bg-blue-500/10" : "border-gray-800 bg-gray-900/40 hover:border-gray-700"
                  }`}
                >
                  <Icon className="h-5 w-5 text-gray-300 shrink-0" />
                  <span className="text-sm font-medium text-white">{method.label}</span>
                  {selected && <CheckCircle2 className="h-4 w-4 text-blue-400 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Method Details */}
          {selectedMethod && methods && (
            <div className="border border-gray-800 bg-gray-900/40 p-6 space-y-4">
              {selectedMethod === "bankTransfer" && methods.bankTransfer.enabled && (
                <>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dados Bancários</h3>
                  <div className="space-y-3 text-sm">
                    {methods.bankTransfer.bankName && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Banco</span>
                        <span className="text-white font-medium">{methods.bankTransfer.bankName}</span>
                      </div>
                    )}
                    {methods.bankTransfer.accountHolder && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Titular</span>
                        <span className="text-white font-medium">{methods.bankTransfer.accountHolder}</span>
                      </div>
                    )}
                    {methods.bankTransfer.iban && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">IBAN</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium font-mono text-xs">{methods.bankTransfer.iban}</span>
                          <button onClick={() => handleCopy(methods.bankTransfer.iban)} className="text-gray-500 hover:text-white transition-colors">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    {methods.bankTransfer.reference && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Referência</span>
                        <span className="text-white font-medium">{methods.bankTransfer.reference}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {selectedMethod === "multicaixa" && methods.multicaixa.enabled && (
                <>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Multicaixa</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Entidade</span>
                      <span className="text-white font-medium">{methods.multicaixa.entity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Referência</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{methods.multicaixa.reference}</span>
                        <button onClick={() => handleCopy(methods.multicaixa.reference)} className="text-gray-500 hover:text-white transition-colors">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Gera a referência após confirmação do pedido.</p>
                  </div>
                </>
              )}

              {selectedMethod === "paypal" && methods.paypal.enabled && (
                <div className="text-sm text-gray-400">
                  Serás redirecionado para o PayPal para concluir o pagamento.
                  {methods.paypal.email && <p className="mt-2 text-gray-500">Email: {methods.paypal.email}</p>}
                </div>
              )}

              {selectedMethod === "stripe" && methods.stripe.enabled && (
                <div className="text-sm text-gray-400">
                  Pagamento processado via Stripe. Cartões de crédito/débito aceites.
                </div>
              )}

              <button
                onClick={handlePurchase}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 font-bold transition-colors disabled:opacity-60 mt-4"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                {submitting ? "A registar..." : "Solicitar Compra"}
              </button>
            </div>
          )}
        </section>
      )}

      {selectedPlan && activeMethods.length === 0 && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Nenhum método de pagamento ativo. Contacta o administrador.
        </div>
      )}
    </div>
  );
}
