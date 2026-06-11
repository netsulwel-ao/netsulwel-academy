"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  CreditCard, Crown, Zap, Lock, ArrowUpRight, Building2,
  Smartphone, Loader2, CheckCircle2, AlertCircle, Copy,
  ExternalLink, Upload, FileText, X, ChevronRight, Globe,
} from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import type { PlatformSettings } from "@/types/settings";
import type { Course } from "@/types/course";

type PlanId = "smart" | "golden";
type Step = "plan" | "method" | "checkout";

async function uploadReceipt(file: File): Promise<string> {
  const res = await fetch("/api/upload/presign", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder: "receipts" }),
  });
  if (!res.ok) throw new Error("Falha ao obter URL de upload.");
  const { presignedUrl, publicUrl } = await res.json();
  const up = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!up.ok) throw new Error("Falha ao enviar comprovativo.");
  return publicUrl;
}

export default function DashboardFinancesPage() {
  const { user, plan: currentPlan, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId");

  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ file: File; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsSnap, courseSnap] = await Promise.all([
          getDoc(doc(db, "settings", "platform")),
          courseId ? getDoc(doc(db, "courses", courseId)) : Promise.resolve(null),
        ]);
        if (settingsSnap.exists()) setSettings(settingsSnap.data() as PlatformSettings);
        if (courseSnap?.exists()) {
          const c = { id: courseSnap.id, ...courseSnap.data() } as Course;
          setCourse(c);
          setStep("method");
        }
      } catch {
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const plans = settings?.plans;
  const methods = settings?.paymentMethods;

  const activeMethods = methods ? [
    methods.bankTransfer.enabled && { id: "bankTransfer", label: "Transferência Bancária", icon: Building2 },
    methods.multicaixa.enabled && { id: "multicaixa", label: "Multicaixa", icon: Smartphone },
    methods.paypal.enabled && { id: "paypal", label: "PayPal", icon: CreditCard },
    methods.stripe.enabled && { id: "stripe", label: "Stripe", icon: CreditCard },
  ].filter(Boolean) as { id: string; label: string; icon: React.ElementType }[] : [];

  const needsReceipt = selectedMethod === "bankTransfer" || selectedMethod === "multicaixa";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceipt({ file, preview: URL.createObjectURL(file) });
  };

  const grantAccess = async (type: string, itemId?: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    if (type === "standalone" && itemId) {
      await updateDoc(userRef, { enrolledCourses: arrayUnion(itemId) });
    } else if (type === "smart" || type === "golden") {
      await updateDoc(userRef, { plan: type });
    }
  };

  const handlePurchase = async (paypalTransactionId?: string) => {
    if (!selectedMethod || !user) return;
    if (!course && (!selectedPlan || !plans)) return;
    setSubmitting(true);
    try {
      let receiptUrl = "";
      if (needsReceipt && receipt) {
        receiptUrl = await uploadReceipt(receipt.file);
      }

      const isConfirmed = !!paypalTransactionId;
      const saleType = course ? "standalone" : selectedPlan!;

      const saleData = {
        userId: user.uid,
        userName: user.displayName || "Aluno",
        userEmail: user.email || "",
        amount: course ? (course.price ?? 0) : (plans![selectedPlan!]?.price ?? 0),
        paymentMethod: activeMethods.find((m) => m.id === selectedMethod)?.label || selectedMethod,
        receiptUrl: receiptUrl || "",
        status: isConfirmed ? "confirmed" as const : "pending" as const,
        type: saleType,
        itemId: course?.id ?? selectedPlan,
        itemTitle: course?.title ?? undefined,
        paypalTransactionId: paypalTransactionId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "sales"), saleData);

      if (isConfirmed) {
        await grantAccess(saleType, course?.id);
        toast.success("Pagamento confirmado! Bem-vindo ao curso.");
      } else {
        toast.success("Pedido registado! O pagamento será confirmado em breve.");
      }

      if (course) { router.push("/dashboard/courses/" + course.id); return; }
      setSelectedPlan(null);
      setSelectedMethod(null);
      setReceipt(null);
      setStep("plan");
    } catch {
      toast.error("Erro ao registar pedido. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  const planPill = isAdmin ? (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border bg-purple-500/15 text-purple-300 border-purple-500/25">
      <Crown className="h-4 w-4" /> Admin
    </span>
  ) : currentPlan === "golden" ? (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border bg-yellow-500/15 text-yellow-300 border-yellow-500/25">
      <Crown className="h-4 w-4" /> Golden
    </span>
  ) : currentPlan === "smart" ? (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border bg-green-500/15 text-green-300 border-green-500/25">
      <Zap className="h-4 w-4" /> Smart
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border bg-gray-500/10 text-gray-300 border-gray-700/60">
      <Lock className="h-4 w-4" /> Grátis
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <CreditCard className="h-6 w-6 text-blue-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Checkout</h1>
          <p className="mt-1 text-gray-400">Escolhe o plano e o método de pagamento.</p>
          <div className="mt-3">{planPill}</div>
        </div>
      </div>

      {/* Steps bar */}
      <div className="flex items-center gap-2 text-base flex-wrap">
        {(["plan", "method", "checkout"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`flex items-center justify-center w-7 h-7 text-sm font-bold border ${
              step === s ? "border-blue-500 bg-blue-500/10 text-blue-400" :
              ["plan", "method", "checkout"].indexOf(step) >= i ? "border-green-500 bg-green-500/10 text-green-400" :
              "border-gray-700 text-gray-600"
            }`}>{i + 1}</span>
            <span className={`${step === s ? "text-white" : "text-gray-500"}`}>
              {s === "plan" ? "Plano" : s === "method" ? "Pagamento" : "Confirmação"}
            </span>
            {i < 2 && <span className="text-gray-700">—</span>}
          </div>
        ))}
      </div>

      {/* Course info (standalone purchase) */}
      {course && (
        <section>
          <div className="border border-gray-800 bg-gray-900/40 p-6">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Curso Avulso</p>
            <h2 className="text-3xl font-bold text-white mb-2">{course.title}</h2>
            <p className="text-gray-400 text-base mb-4">{course.description}</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              {(course.price ?? 0).toLocaleString("pt-AO")} <span className="text-lg sm:text-xl text-gray-500 font-normal">Kz</span>
            </p>
          </div>
        </section>
      )}

      {/* Step 1: Plans (only when not buying a course) */}
      {step === "plan" && !course && plans && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Seleciona o teu Plano</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(["smart", "golden"] as PlanId[]).map((id) => {
              const plan = plans[id];
              const isCurrent = currentPlan === id;
              const selected = selectedPlan === id;
              return (
                <button
                  key={id}
                  onClick={() => { setSelectedPlan(id); setStep("method"); }}
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
                      <span className="text-3xl font-bold text-white">{plan.label}</span>
                    </div>
                    {isCurrent && <span className="text-sm font-bold text-green-400 border border-green-500/30 px-2 py-1">Atual</span>}
                  </div>
                  <p className="text-gray-400 text-base mb-4">{plan.description}</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                    {plan.price.toLocaleString("pt-AO")} <span className="text-lg sm:text-xl text-gray-500 font-normal">Kz</span>
                  </p>
                  {plan.features.length > 0 && (
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-base text-gray-300">
                          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
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

      {/* Step 2: Payment Method */}
      {step === "method" && (selectedPlan || course) && (
        <section>
          <button onClick={() => setStep("plan")} className="text-base text-gray-400 hover:text-white transition-colors mb-4">&larr; Voltar aos planos</button>
          <h2 className="text-xl font-bold text-white mb-4">Método de Pagamento</h2>
          {activeMethods.length === 0 ? (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-base text-amber-200">
              <AlertCircle className="h-5 w-5 shrink-0" />
              Nenhum método de pagamento ativo. Contacta o administrador.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeMethods.map((method) => {
                const Icon = method.icon;
                const selected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => { setSelectedMethod(method.id); setStep("checkout"); }}
                    className={`flex items-center gap-3 border p-4 transition-all ${
                      selected ? "border-blue-500 bg-blue-500/10" : "border-gray-800 bg-gray-900/40 hover:border-gray-700"
                    }`}
                  >
                    <Icon className="h-6 w-6 text-gray-300 shrink-0" />
                    <span className="text-base font-medium text-white">{method.label}</span>
                    <ChevronRight className="h-5 w-5 text-gray-500 ml-auto shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Step 3: Checkout / Confirmation */}
      {step === "checkout" && selectedMethod && methods && (selectedPlan || course) && (
        <section>
          <button onClick={() => setStep("method")} className="text-base text-gray-400 hover:text-white transition-colors mb-4">&larr; Voltar aos métodos</button>

          <div className="border border-gray-800 bg-gray-900/40 p-6 space-y-6">
            {/* Resumo */}
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider mb-3">Resumo</h3>
              <div className="bg-gray-950/50 border border-gray-800 p-4 space-y-2 text-base">
                {course ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Curso</span>
                      <span className="text-white font-medium text-right">{course.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tipo</span>
                      <span className="text-white font-medium">Curso Avulso</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Plano</span>
                    <span className="text-white font-medium">{plans?.[selectedPlan!]?.label}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Valor</span>
                  <span className="text-white font-bold">{(course ? (course.price ?? 0) : (plans?.[selectedPlan!]?.price ?? 0)).toLocaleString("pt-AO")} Kz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Método</span>
                  <span className="text-white font-medium">{activeMethods.find((m) => m.id === selectedMethod)?.label}</span>
                </div>
              </div>
            </div>

            {/* Bank Transfer Details */}
            {selectedMethod === "bankTransfer" && methods.bankTransfer.enabled && (
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider mb-3">Dados Bancários</h3>
                <div className="space-y-3 text-base bg-gray-950/50 border border-gray-800 p-4">
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
                        <span className="text-white font-medium font-mono text-sm">{methods.bankTransfer.iban}</span>
                        <button onClick={() => handleCopy(methods.bankTransfer.iban)} className="text-gray-500 hover:text-white"><Copy className="h-4 w-4" /></button>
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
              </div>
            )}

            {/* Multicaixa Details */}
            {selectedMethod === "multicaixa" && methods.multicaixa.enabled && (
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider mb-3">Multicaixa</h3>
                <div className="space-y-3 text-base bg-gray-950/50 border border-gray-800 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Entidade</span>
                    <span className="text-white font-medium">{methods.multicaixa.entity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Referência</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{methods.multicaixa.reference}</span>
                      <button onClick={() => handleCopy(methods.multicaixa.reference)} className="text-gray-500 hover:text-white"><Copy className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Gera a referência após confirmação do pedido.</p>
                </div>
              </div>
            )}

            {/* PayPal */}
            {selectedMethod === "paypal" && methods.paypal.enabled && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">PayPal</h3>
                <p className="text-base text-gray-400">Pagamento seguro processado via PayPal.</p>

                {methods.paypal.clientId ? (
                  <div className="min-h-[200px]">
                    <PayPalScriptProvider options={{ clientId: methods.paypal.clientId, currency: "USD" }}>
                      <PayPalButtons
                        style={{ color: "blue", shape: "rect", label: "pay", height: 48 }}
                        createOrder={(_data, actions) => {
                          const amount = course ? (course.price ?? 0) : (plans?.[selectedPlan!]?.price ?? 0);
                          return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [{
                              amount: { value: amount.toString(), currency_code: "USD" },
                              description: course ? course.title : (plans?.[selectedPlan!]?.label || "Plano"),
                            }],
                          });
                        }}
                        onApprove={async (_data, actions) => {
                          const details = await actions.order!.capture();
                          if (details.status === "COMPLETED") {
                            await handlePurchase(details.id);
                          } else {
                            toast.error("O pagamento não foi concluído.");
                          }
                        }}
                        onError={() => toast.error("Erro ao processar pagamento PayPal.")}
                      />
                    </PayPalScriptProvider>
                  </div>
                ) : (
                  <>
                    <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-base text-amber-200">
                      PayPal não configurado — o administrador precisa definir o Client ID nas configurações.
                    </div>
                    {methods.paypal.email && (
                      <div className="flex items-center justify-between bg-gray-950/50 border border-gray-800 px-4 py-3">
                        <span className="text-base text-white font-medium">{methods.paypal.email}</span>
                        <button onClick={() => handleCopy(methods.paypal.email)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
                          <Copy className="h-4 w-4" /> Copiar
                        </button>
                      </div>
                    )}
                    <a href={methods.paypal.email ? `https://www.paypal.com/paypalme/${methods.paypal.email.split("@")[0]}` : "#"}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#0070ba] hover:bg-[#003087] text-white py-3 font-bold transition-colors">
                      <ExternalLink className="h-5 w-5" /> Pagar com PayPal (manual)
                    </a>
                  </>
                )}
              </div>
            )}

            {/* Stripe */}
            {selectedMethod === "stripe" && methods.stripe.enabled && (
              <div className="text-base text-gray-400 py-4">
                Pagamento processado via Stripe. Cartões de crédito/débito aceites.
              </div>
            )}

            {/* Receipt Upload — only for bank transfer and multicaixa */}
            {needsReceipt && (
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider mb-3">Comprovativo de Pagamento</h3>
                <p className="text-sm text-gray-500 mb-3">Faz upload do comprovativo (foto, PDF, screenshot) após realizar o pagamento.</p>
                {!receipt ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-gray-500 p-8 cursor-pointer transition-colors">
                    <Upload className="h-10 w-10 text-gray-500 mb-2" />
                    <span className="text-base text-gray-400">Clique para selecionar o comprovativo</span>
                    <span className="text-sm text-gray-600 mt-1">PNG, JPG, PDF</span>
                    <input type="file" accept="image/png,image/jpeg,image/jpg,application/pdf" onChange={handleReceiptChange} className="hidden" />
                  </label>
                ) : (
                  <div className="border border-gray-800 bg-gray-950/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <span className="text-base text-white">{receipt.file.name}</span>
                        <span className="text-sm text-gray-500">({(receipt.file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button onClick={() => { setReceipt(null); }} className="text-gray-500 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    {receipt.file.type.startsWith("image/") && (
                      <img src={receipt.preview} alt="Comprovativo" className="max-h-48 object-contain border border-gray-800" />
                    )}
                    <p className="text-sm text-green-400 flex items-center gap-1 mt-2">
                      <CheckCircle2 className="h-4 w-4" /> Comprovativo selecionado
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit — hidden for PayPal (handled by the button itself) */}
            {selectedMethod !== "paypal" && (
              <>
                <button
                  onClick={() => handlePurchase()}
                  disabled={submitting || (needsReceipt && !receipt) || uploading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 font-bold transition-colors disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUpRight className="h-5 w-5" />}
                  {submitting ? "A registar..." : "Concluir Pedido"}
                </button>

                {needsReceipt && !receipt && (
                  <p className="text-sm text-gray-500 text-center">Anexa o comprovativo antes de concluir.</p>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
