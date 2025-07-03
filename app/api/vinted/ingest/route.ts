import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";

import styleVibes from "@/data/vinted/styles.json";

export const runtime = "nodejs";

const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
};

export async function POST(req: NextRequest) {
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const sendStatus = async (status: string, progress?: number) => {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ status, progress })}\n\n`));
    };

    const BATCH_SIZE = 20; // A smaller batch size is fine for this focused dataset

    const ingestData = async () => {
        try {
            console.log("Starting ingestion process for styles...");
            await sendStatus("Starting ingestion...", 0);

            const client = createSupabaseClient();
            
            await sendStatus("Cleaning existing data from vinted_documents table...", 5);
            // This command deletes all rows to ensure a fresh import.
            await client.from("vinted_documents").delete().gt("id", -1);

            await sendStatus("Processing style data...", 20);
            
            // --- ✨ FIXED LOGIC HERE ---
            // Process each style object from the imported JSON
            const documentsToIngest = styleVibes.styles.map((style: any) => {
                // Create a rich, descriptive text content for each style.
                // This now includes the list of brands.
                const pageContent = `
                    Fashion Style: ${style.name}.
                    Description: ${style.description}.
                    Associated Brands: ${style.brands.join(', ')}.
                    Common Hashtags: ${style.hashtags.join(', ')}.
                `.trim().replace(/\s+/g, ' '); // Clean up whitespace

                const metadata = { 
                    dataset: 'style_vibes', 
                    style_name: style.name, 
                    id: style.id, 
                    source: 'styles.json' 
                };
                
                return { pageContent, metadata };
            });

            // The text splitter is optional for such short content but good practice.
            const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 100 });
            const langchainDocs = await splitter.createDocuments(
                documentsToIngest.map(d => d.pageContent),
                documentsToIngest.map(d => d.metadata)
            );
            
            await sendStatus("All styles processed. Starting vectorization...", 60);
            const totalDocs = langchainDocs.length;
            console.log(`Total documents to vectorize: ${totalDocs}`);

            const embeddings = new OpenAIEmbeddings({ modelName: "text-embedding-3-small" });

            // Ingest in batches
            for (let i = 0; i < totalDocs; i += BATCH_SIZE) {
                const batch = langchainDocs.slice(i, i + BATCH_SIZE);
                const progress = 60 + (i / totalDocs) * 40;
                await sendStatus(`Vectorizing batch ${Math.ceil(i/BATCH_SIZE) + 1} of ${Math.ceil(totalDocs/BATCH_SIZE)}...`, Math.round(progress));
                
                await SupabaseVectorStore.fromDocuments(batch, embeddings, {
                    client,
                    tableName: "vinted_documents",
                    queryName: "match_documents",
                });
                await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between batches
            }

            await sendStatus("Ingestion completed successfully!", 100);
            console.log("Ingestion process completed.");

        } catch (e: any) {
            console.error("Error in ingestion process:", e);
            const errorMessage = e.message || "An unknown error occurred.";
            await sendStatus(`Error: ${errorMessage}`, 0);
        } finally {
            await writer.close();
        }
    };

    ingestData();

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}