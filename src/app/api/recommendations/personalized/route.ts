import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ courses: [] });
    }

    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const firestore = admin.firestore();

    // Fetch user's enrolled courses
    const userSnap = await firestore.collection("users").doc(uid).get();
    const enrolledIds: string[] = userSnap.data()?.enrolledCourses ?? [];

    // Fetch user's recent events (last 30 days, interest signals)
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const eventsSnap = await firestore
      .collection("events")
      .where("userId", "==", uid)
      .where("createdAt", ">=", monthAgo)
      .where("type", "in", ["course_view", "course_enroll", "lesson_complete", "course_complete"])
      .get();

    const viewedIds = new Set<string>();
    const completedIds = new Set<string>();
    eventsSnap.forEach((d) => {
      const data = d.data();
      if (data.targetId) {
        if (data.type === "course_complete") completedIds.add(data.targetId);
        else viewedIds.add(data.targetId);
      }
    });

    // Fetch all published courses
    const coursesSnap = await firestore
      .collection("courses")
      .where("status", "==", "published")
      .get();

    const allCourses: Record<string, unknown>[] = [];
    const enrolledTitles: string[] = [];
    const viewedTitles: string[] = [];
    const completedTitles: string[] = [];

    coursesSnap.forEach((d) => {
      const data = d.data();
      const course = { id: d.id, ...data };
      allCourses.push(course);
      const title = (data.title || "") as string;
      if (enrolledIds.includes(d.id)) {
        enrolledTitles.push(title);
      }
      if (viewedIds.has(d.id)) {
        viewedTitles.push(title);
      }
      if (completedIds.has(d.id)) {
        completedTitles.push(title);
      }
    });

    // Build prompt
    const enrolledPart = enrolledTitles.length
      ? `Inscrito em: ${enrolledTitles.join(", ")}`
      : "Não está inscrito em nenhum curso";

    const viewedPart = viewedTitles.length
      ? `Visualizou recentemente: ${viewedTitles.join(", ")}`
      : "";

    const completedPart = completedTitles.length
      ? `Completou: ${completedTitles.join(", ")}`
      : "";

    const availableCourses = allCourses
      .filter((c) => !enrolledIds.includes(c.id as string))
      .map((c) => `${c.id as string}: "${c.title as string}" — ${(c.description as string)?.slice(0, 100) || "sem descrição"}`)
      .join("\n");

    const prompt = `Eres um assistente de recomendação de cursos para a plataforma Netsulwel Academy. Com base no perfil do aluno, recomenda cursos que ainda não possui.

Perfil do aluno:
${enrolledPart}
${viewedPart}
${completedPart}

Cursos disponíveis:
${availableCourses || "Nenhum curso disponível."}

Responde APENAS com um array JSON de IDs dos cursos que recomendas (máximo 8), ordenados do mais relevante para o menos relevante. Exemplo: ["id1", "id2", "id3"]`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!groqRes.ok) {
      return NextResponse.json({ courses: [] });
    }

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content || "";

    const match = content.match(/\[[\s\S]*?\]/);
    if (!match) {
      return NextResponse.json({ courses: [] });
    }

    let recommendedIds: string[];
    try {
      recommendedIds = JSON.parse(match[0]) as string[];
    } catch {
      return NextResponse.json({ courses: [] });
    }

    const courseMap = new Map(allCourses.map((c) => [c.id as string, c]));
    const recommended = recommendedIds
      .map((id) => courseMap.get(id))
      .filter(Boolean) as Record<string, unknown>[];

    return NextResponse.json({ courses: recommended });
  } catch {
    return NextResponse.json({ courses: [] });
  }
}
