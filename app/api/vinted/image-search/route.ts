import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

export const runtime = "nodejs";

const IMAGE_ANALYSIS_PROMPT = `You are a fashion expert AI. Analyze the attached image of an outfit or clothing item.
Your task is to identify key features and generate a list of 3-5 specific, high-quality search queries that could be used to find similar items on marketplaces like Vinted or Depop.

Focus on:
- Item type (e.g., "midi skirt", "graphic t-shirt", "leather trench coat").
- Style or Core Aesthetic (e.g., "Y2K", "gorpcore", "coquette", "90s grunge", "avant-garde").
- Key materials, patterns, and colors (e.g., "distressed denim", "plaid wool", "mesh overlay", "earth tones").
- Potential brand names if a logo is visible or the style is iconic to a certain brand.

Respond ONLY with a JSON object in the following format, with no other text before or after it:
{
  "generatedSearchQueries": ["query 1", "query 2", "query 3"]
}`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Convert the image to a base64 string
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");

    const model = new ChatOpenAI({
      modelName: "gpt-4o", // gpt-4o is excellent for this
      maxTokens: 512,
    });

    const message = new HumanMessage({
      content: [
        { type: "text", text: IMAGE_ANALYSIS_PROMPT },
        {
          type: "image_url",
          image_url: `data:${imageFile.type};base64,${imageBase64}`,
        },
      ],
    });

    const response = await model.invoke([message]);
    
    // The response content should be a JSON string, so we parse it
    const jsonResponse = JSON.parse(response.content as string);

    if (!jsonResponse.generatedSearchQueries || jsonResponse.generatedSearchQueries.length === 0) {
        throw new Error("AI failed to generate search queries from the image.");
    }

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error("Error in image search API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze image." },
      { status: 500 }
    );
  }
}