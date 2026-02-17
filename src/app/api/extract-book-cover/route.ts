import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { base64, mediaType } = await request.json();

  if (!base64) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Book cover scanning is not configured" },
      { status: 503 }
    );
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mediaType || "image/jpeg",
        data: base64,
      },
    },
    {
      text: "This is a photo of a cookbook or recipe book cover. Extract ONLY the title of the book. Return just the title text, nothing else. If you cannot identify a book title, return an empty string.",
    },
  ]);

  const title = result.response.text().trim();

  if (!title) {
    return NextResponse.json(
      { error: "Could not identify a book title in this image" },
      { status: 422 }
    );
  }

  return NextResponse.json({ title });
}
