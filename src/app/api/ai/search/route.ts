import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ terms: [] });
    }

    const prompt = `És um assistente de pesquisa para uma plataforma de cursos online chamada Netsulwel Academy. Os cursos cobrem: tecnologia, programação, finanças, investimentos, marketing, design, produtividade, negócios, IA, crypto, trading, contabilidade, empreendedorismo.

O utilizador pesquisou: "${query}"

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
      return NextResponse.json({ terms: [query.toLowerCase()] });
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? "[]";

    // Extract JSON array from response
    const match = content.match(/\[[\s\S]*?\]/);
    const terms: string[] = match ? JSON.parse(match[0]) : [query.toLowerCase()];

    // Always include the original query
    const original = query.toLowerCase().trim();
    if (!terms.includes(original)) {
      terms.unshift(original);
    }

    return NextResponse.json({ terms });
  } catch (err) {
    console.error("Search AI error:", err);
    const fallback = (await req.json().catch(() => ({ query: "" })))?.query?.toLowerCase()?.trim() || "";
    return NextResponse.json({ terms: fallback ? [fallback] : [] });
  }
}
