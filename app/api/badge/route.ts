import { NextResponse } from "next/server";
import OpenAI from "openai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const REGION = process.env.AWS_S3_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
  region: REGION,
  endpoint: `https://s3.${REGION}.amazonaws.com`,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});


export async function POST(req: Request) {
  try {
    const { title } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    // Generate badge (base64)
    const imgRes = await client.images.generate({
      model: "gpt-image-1",
      prompt: `
        Create a circular badge illustration with colorful friendly style,
        and no text and no person. Represents the honorary title: "${title}".
      `,
      size: "1024x1024"
    });
    if (!imgRes || !imgRes.data || !imgRes.data.length || !imgRes.data[0].b64_json) {
      throw new Error("Image generation failed: No data returned from OpenAI.");
    }
    const base64 = imgRes.data[0].b64_json!;
    const base64data = imgRes.data[0].b64_json;
    
    if (!base64data) throw new Error("No image returned");

    // Convert to Buffer
    const imageBuffer = Buffer.from(base64data, "base64");

    // Create filename
    const key = `badges/${Date.now()}-${title.replace(/\W+/g, "_")}.png`;

    // Upload to S3 (NO ACL!)
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: imageBuffer,
        ContentType: "image/png"
      })
    );

    // Public URL (only works if bucket policy allows public read)
    const imageUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      imageUrl,
      imageBase64: base64data // optional, you can remove later
    });

  } catch (err: any) {
    console.error("Badge generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate badge", details: err.message },
      { status: 500 }
    );
  }
}