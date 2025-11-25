import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Detect readable black/white text color based on luminance
function readableText(hex: string): string {
  hex = hex.replace("#", "");

  if (hex.length === 3) {
    hex = hex.split("").map(c => c + c).join("");
  }

  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const L =
    0.2126 * Math.pow(r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4), 1) +
    0.7152 * Math.pow(g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4), 1) +
    0.0722 * Math.pow(b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4), 1);

  return L > 0.55 ? "#000000" : "#FFFFFF";
}

// Adds a subtle glow stroke around text
function textShadowFor(color: string) {
  return color === "#000000"
    ? "0 1px 3px rgba(255,255,255,0.65)"
    : "0 2px 6px rgba(0,0,0,0.65)";
}

// Chooses a card bg with contrast
function cardBgForText(textColor: string) {
  return textColor === "#000000"
    ? "rgba(255,255,255,0.15)"
    : "rgba(0,0,0,0.35)";
}

export async function POST(req: Request) {
  try {
    const { title, nonprofits } = await req.json();

    if (!title || !nonprofits) {
      return NextResponse.json(
        { error: "Missing title or nonprofits" },
        { status: 400 }
      );
    }

    const npList = nonprofits
      .map((np: any) => `<li style="font-size: 0.8rem; margin-bottom: 0.25rem;">${np.name}</li>`)
      .join("");

    const prompt = `
Return STRICT JSON ONLY.

Generate:
- g1, g2, g3: 3 hex colors for a vertical gradient inspired by the title "${title}"
- cardHtml: the middle card markup:

<div>
  <h2 style = "font-size: .8em; padding-bottom: 10px;">I support these Non-profits:</h2>
  <ul>
    ${npList}
  </ul>
</div>

NO other fields.
`.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return JSON only. No backticks." },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.4
    });

    let raw = completion.choices[0].message.content || "";
    raw = raw.replace(/```json/gi, "").replace(/```/g, "");

    const { g1, g2, g3, cardHtml } = JSON.parse(raw);

    // Compute high-contrast readable text color
    const textColor = readableText(g1);
    const glow = textShadowFor(textColor);
    const cardBg = cardBgForText(textColor);

    const finalHTML = `
<main class="w-full p-10">
  <img id="badge-image"
       class="w-64 h-64 rounded-full shadow-2xl mx-auto border-4 bg-white/80"
       style="box-shadow: 0 4px 20px rgba(0,0,0,0.25);" />

  <h1 style="
    margin-top: 1.2rem;
    text-align: center;
    font-size: 1.4rem;
    font-weight: 800;
    font-family: 'Poppins', sans-serif;
    color: ${textColor};
    text-shadow: ${glow};
  ">
    ${title}
  </h1>

  <div style="
    margin-top: 2.5rem;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
    padding: 1.5rem;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
    background: ${cardBg};
    color: ${textColor};
    text-shadow: ${glow};
  ">
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
