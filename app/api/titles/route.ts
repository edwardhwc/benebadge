import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { nonprofits } = await req.json();

    if (!nonprofits || nonprofits.length === 0) {
      return NextResponse.json(
        { error: "No nonprofits provided." },
        { status: 400 }
      );
    }

    const prompt = `
      Create 5 fun titles for someone who donates to:
      ${nonprofits.join(", ")}.

      RULES:
      - No punctuation (NO quotes, commas, dashes, or colons).
      - Titles must be short (2–6 words).
      - No explanations, just the list.
      - No numbering.
      - Each title must be unique.
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Respond ONLY with 5 raw title lines. No punctuation. No quotes." },
        { role: "user", content: prompt }
      ],
      max_tokens: 100
    });

    let text = completion.choices[0].message.content || "";

    // Split into lines & clean each title
    const titles = text
      .split("\n")
      .map(t => t
        .trim()
        .replace(/^\d+\.\s*/, "")   // remove numbering
        .replace(/["'.,:;!?-]/g, "") // remove ALL punctuation
        .replace(/\s+/g, " ")         // collapse extra spaces
        .trim()
      )
      .filter(t => t.length > 0)
      .slice(0, 5); // ensure max 5

    return NextResponse.json({ titles });

  } catch (err: any) {
    console.error("Title generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate titles." },
      { status: 500 }
    );
  }
}
