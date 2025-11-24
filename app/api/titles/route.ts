import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { nonprofits } = await req.json();

    if (!nonprofits || nonprofits.length === 0) {
      return NextResponse.json({ error: "No nonprofits provided." }, { status: 400 });
    }

    const prompt = `
      Give 5 fun titles for someone who donates to the following nonprofits.  Incorporate all of them into the title:
      ${nonprofits.join(", ")}.
      Do not include explanations.
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Respond concisely with low verbosity." },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices[0].message.content || "";
    const lines = text
      .split("\n")
      .map(l => l.replace(/^\d+\.\s*/, "")) // remove numbering
      .filter(l => l.trim() !== "");

    return NextResponse.json({ titles: lines });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate titles." }, { status: 500 });
  }
}
