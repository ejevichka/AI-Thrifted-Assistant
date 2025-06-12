import { NextRequest } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";

// Assuming these paths are correct relative to the project root
import brands from "@/data/vinted/vinted-dataset/brand.json";
import sizes from "@/data/vinted/vinted-dataset/sizes.json";
import styleVibes from "@/data/vinted/styles.json";

export const runtime = "nodejs"; // Correct runtime for file access and long processes

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

    const BATCH_SIZE = 50;

    const ingestData = async () => {
        try {
            console.log("Starting ingestion process...");
            await sendStatus("Starting ingestion...", 0);

            const client = createSupabaseClient();
            await sendStatus("Cleaning existing data...", 5);
            // It's good practice to clear old data for a fresh ingest
            await client.from("vinted_documents").delete().neq("id", 0);


            await sendStatus("Processing data files...", 15);
            const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
            
            let allDocuments = [];

            // Process Style Vibes
            await sendStatus("Processing style vibes...", 20);
            const styleDocs = styleVibes.styles.map((style: any) => ({
                pageContent: `Fashion Style: ${style.name}. Description: ${style.description}. Common hashtags: ${style.hashtags.join(', ')}.`,
                metadata: { dataset: 'style_vibes', style_name: style.name, id: style.id, source: 'styles.json' }
            }));
            allDocuments.push(...styleDocs);
            
            // Process Brands
            await sendStatus("Processing brands...", 40);
            const brandDocs = Object.entries(brands).map(([name, id]) => ({
                pageContent: `Fashion Brand: ${name}. This brand is available on Vinted.`,
                metadata: { dataset: 'brands', brand_name: name, id: id, source: 'brand.json' }
            }));
            allDocuments.push(...brandDocs);

            // Process Sizes
            await sendStatus("Processing sizes...", 60);
             const sizeDocs = Object.entries(sizes).flatMap(([category, sizeList]) => 
                (sizeList as string[]).map(size => ({
                    pageContent: `Item Size: ${size} for category ${category}.`,
                    metadata: { dataset: 'sizes', size, category, source: 'sizes.json' }
                }))
            );
            allDocuments.push(...sizeDocs);
            
            // Split all collected documents
            const langchainDocs = await splitter.createDocuments(
                allDocuments.map(d => d.pageContent),
                allDocuments.map(d => d.metadata)
            );
            
            await sendStatus("All data processed. Starting vectorization...", 80);
            const totalDocs = langchainDocs.length;
            console.log(`Total documents to vectorize: ${totalDocs}`);

            const embeddings = new OpenAIEmbeddings({ modelName: "text-embedding-3-small" });

            // Ingest in batches
            for (let i = 0; i < totalDocs; i += BATCH_SIZE) {
                const batch = langchainDocs.slice(i, i + BATCH_SIZE);
                const progress = 80 + (i / totalDocs) * 20;
                await sendStatus(`Vectorizing batch ${Math.ceil(i/BATCH_SIZE) + 1} of ${Math.ceil(totalDocs/BATCH_SIZE)}...`, Math.round(progress));
                
                await SupabaseVectorStore.fromDocuments(batch, embeddings, {
                    client,
                    tableName: "vinted_documents",
                    queryName: "match_documents",
                });
                await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
            }

            await sendStatus("Ingestion completed successfully!", 100);
            console.log("Ingestion process completed.");

        } catch (e: any) {
            console.error("Error in ingestion process:", e);
            await sendStatus(`Error: ${e.message}`, 0);
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