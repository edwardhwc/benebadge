import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { title, nonprofits } = await req.json();

    if (!title || !nonprofits) {
      return NextResponse.json(
        { error: "Missing title or nonprofits" },
        { status: 400 }
      );
    }

    // Nonprofits list markup (safe)
    const npList = nonprofits
      .map((np: any) => `<li class="text-lg">${np.name}</li>`)
      .join("");

    // AI will return:
    // {
    //   g1: "#xxxxxx",
    //   g2: "#xxxxxx",
    //   g3: "#xxxxxx",
    //   cardHtml: "<div>...</div>"
    // }
    const prompt = `
You return JSON ONLY. No commentary.

Generate:
- Three hex colors ("g1", "g2", "g3") inspired by the title: "${title}"
  These should form a smooth vertical gradient.
- A "cardHtml" string containing ONLY the inner card HTML:

Card structure:
<div class="p-6 rounded-2xl shadow-xl bg-white/70 backdrop-blur">
  <h2 class="text-2xl font-semibold mb-4 text-center">Supported Nonprofits</h2>
  <ul class="space-y-2">
    ${npList}
  </ul>
</div>

Return ONLY valid JSON:
{
  "g1": "...",
  "g2": "...",
  "g3": "...",
  "cardHtml": "..."
}
`.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Output STRICT JSON. No HTML outside JSON fields." },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.35
    });

    let raw = completion.choices[0].message.content || "";

    // Remove accidental fences
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(raw);

    const { g1, g2, g3, cardHtml } = parsed;

    // Final HTML (AI only fills interior, we keep layout stable)
    const finalHTML = `
<main class="w-full p-10">
  <img id="badge-image" class="w-64 h-64 rounded-full shadow-2xl mx-auto border-4 bg-white/80" />
  <h1 class="text-4xl font-bold mt-6 text-center">${title}</h1>

  <div class="mt-10 max-w-2xl mx-auto">
    ${cardHtml}
  </div>
</main>
`.trim();

    return NextResponse.json({
      html: finalHTML,
      g1,
      g2,
      g3
    });
  } catch (err: any) {
    console.error("Render Error:", err);
    return NextResponse.json(
      { error: "Render failed", details: err.message },
      { status: 500 }
    );
  }
}
