import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizePromptInput } from "@/lib/html-escape";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`ai-search:${ip}`, { maxRequests: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return NextResponse.json({ error }, { status: 401 });

    const { query } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ terms: [] });
    }

    const sanitized = sanitizePromptInput(query, 200);

    const prompt = `És um assistente de pesquisa para uma plataforma de cursos online chamada Netsulwel Academy. Os cursos cobrem: tecnologia, programação, finanças, investimentos, marketing, design, produtividade, negócios, IA, crypto, trading, contabilidade, empreendedorismo.

O utilizador pesquisou: "${sanitized}"

Gera uma lista de 8 a 12 termos de pesquisa relacionados que ajudem a encontrar cursos relevantes. Inclui:
- Sinónimos e termos relacionados (ex: "dinheiro" → "finanças", "renda", "investimento")
- Categorias relevantes (ex: "marketing" → "publicidade", "vendas")
- Termos em português e inglês (ex: "-programação" e "coding")
- Conceitos adjacentes (ex: "crypto" → "blockchain", "bitcoin")

Responde APENAS com um JSON array de strings, sem explicações. Exemplo: ["termo1", "termo2", "termo3"]`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("Groq error:", await response.text());
      return NextResponse.json({ terms: [sanitized.toLowerCase()] });
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? "[]";

    const match = content.match(/\[[\s\S]*?\]/);
    const terms: string[] = match ? JSON.parse(match[0]) : [sanitized.toLowerCase()];

    const original = sanitized.toLowerCase().trim();
    if (!terms.includes(original)) {
      terms.unshift(original);
    }

    return NextResponse.json({ terms });
  } catch (err) {
    console.error("Search AI error:", err);
    return NextResponse.json({ terms: [] });
  }
}
