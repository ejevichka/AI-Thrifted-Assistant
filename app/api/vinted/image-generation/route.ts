import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt: content } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // A more detailed prompt for better image quality
    const imageGenerationPrompt = `A vibrant, high-resolution, photorealistic image of the following outfit: ${content}. The image should be in the style of a fashion lookbook photo, with a clean background.`;

    // Call the OpenAI Images API
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imageGenerationPrompt,
      n: 1, // Generate a single image
      size: "1024x1024", // Specify the image size
    });

    const imageUrl = response.data[0].url;

    // Return the image URL in a structured JSON response
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Error in image generation route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}