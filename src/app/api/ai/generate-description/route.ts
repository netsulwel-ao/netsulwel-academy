import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { title, modules } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Título é obrigatório." }, { status: 400 });
    }

    // Monta lista de módulos e aulas para o contexto
    const modulesText = modules
      ?.map((m: { title: string; videos: { title: string }[] }, i: number) => {
        const lessons = m.videos
          ?.filter((v: { title: string }) => v.title?.trim())
          .map((v: { title: string }) => `    - ${v.title}`)
          .join("\n");
        return `  Módulo ${i + 1}: ${m.title || "(sem nome)"}${lessons ? "\n" + lessons : ""}`;
      })
      .join("\n") ?? "";

    const prompt = `És um copywriter especializado em cursos online para uma plataforma de educação em tecnologia, finanças e investimentos chamada Netsulwel Academy.

Gera uma descrição de curso atrativa, clara e profissional em português europeu (Portugal/Angola) com base nas seguintes informações:

Título do curso: ${title}
${modulesText ? `\nEstrutura do curso:\n${modulesText}` : ""}

Requisitos da descrição:
- Entre 80 e 120 palavras
- Tom motivador mas profissional
- Destaca o que o aluno vai aprender e o valor prático
- Não uses bullet points — escreve em prosa fluida
- Não incluas frases genéricas como "este curso é para si"
- Termina com uma frase de chamada à ação subtil

Responde APENAS com o texto da descrição, sem títulos, sem aspas, sem explicações adicionais.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq error:", err);
      return NextResponse.json({ error: "Erro ao contactar a IA." }, { status: 500 });
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ description });
  } catch (error) {
    console.error("Erro na rota de geração:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
