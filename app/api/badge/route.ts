import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { title } = await req.json();
    if (!title) {
      return NextResponse.json(
        { error: "Missing title" },
        { status: 400 }
      );
    }

    const prompt = `
Create a circular badge illustration with:
- colorful, fun style
- NO text anywhere
This badge represents the honorary title: "${title}"
`;

    const img = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    const b64 = img.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("No base64 data returned from image generation");
    }

    return NextResponse.json({ imageBase64: b64 });
  } catch (err: any) {
    console.error("Badge generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate badge", details: err.message },
      { status: 500 }
    );
  }
}
