import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { type, title, target } = await req.json();

    if (!type) {
      return NextResponse.json({ error: "Tipo é obrigatório." }, { status: 400 });
    }

    const typeLabels: Record<string, string> = {
      promo: "Promoção / Upgrade de plano",
      new_course: "Lançamento de novo curso",
      live: "Aula ao vivo a acontecer agora",
      general: "Aviso geral / comunicado",
    };

    const targetLabels: Record<string, string> = {
      all: "todos os alunos",
      free: "alunos no plano gratuito",
      smart: "alunos no Plano Smart",
      golden: "alunos no Plano Golden",
    };

    const prompt = `És um especialista em marketing para plataformas de educação online. Trabalhas para a Netsulwel Academy, uma plataforma angolana de cursos de tecnologia, finanças e investimentos.

Cria um anúncio do tipo "${typeLabels[type] || type}" direcionado a ${targetLabels[target] || "todos os alunos"}.
${title ? `Tema/contexto do anúncio: "${title}"` : ""}

Responde APENAS com um JSON válido neste formato exato (sem markdown, sem explicações):
{
  "title": "título curto e impactante (máx 60 chars, pode ter 1 emoji no início)",
  "body": "mensagem persuasiva em 2-3 frases (máx 120 chars), tom direto e motivador",
  "ctaLabel": "texto do botão de ação (máx 25 chars)",
  "badgeLabel": "texto do badge (máx 35 chars, ex: 'Oferta por 24h · Poupa 40%')",
  "benefits": [
    { "icon": "emoji", "title": "benefício curto", "desc": "descrição em 1 frase" },
    { "icon": "emoji", "title": "benefício curto", "desc": "descrição em 1 frase" },
    { "icon": "emoji", "title": "benefício curto", "desc": "descrição em 1 frase" }
  ]
}

Regras:
- Português europeu/angolano
- Tom confiante, urgente mas não agressivo
- Benefits só se fizer sentido para o tipo (promo e new_course sim, live e general podem ter 0-2)
- Para tipo "live": badgeLabel deve incluir "🔴 AO VIVO"
- Para tipo "promo": foca nos benefícios do plano
- Para tipo "new_course": foca no que o aluno vai aprender`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq error:", err);
      return NextResponse.json({ error: "Erro ao contactar a IA." }, { status: 500 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Parse JSON da resposta
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Resposta inválida da IA." }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro na rota de geração de anúncio:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
