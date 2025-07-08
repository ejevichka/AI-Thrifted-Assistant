import { StreamingTextResponse, Message as VercelChatMessage } from 'ai';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { StateGraph, END, START } from "@langchain/langgraph";
import { HumanMessage } from '@langchain/core/messages'; // <-- Import HumanMessage

export const runtime = "edge";

// --- Helper Functions (Unchanged) ---
const formatVercelMessages = (messages: VercelChatMessage[]) => {
  return messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
};

const formatDocs = (docs: Document[]) => {
    return docs.map(doc => doc.pageContent).join('\n\n');
};

// --- Initializations (Unchanged) ---
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const embeddings = new OpenAIEmbeddings({ modelName: "text-embedding-3-small" });
const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "vinted_documents",
    queryName: "match_documents"
});
const retriever = vectorStore.asRetriever(15);
const model = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0.5, streaming: true });

const FASHION_ASSISTANT_TEMPLATE = `You are an AI fashion assistant for Vinted and Depop.
Your SOLE PURPOSE is to translate user requests and the provided context into a list of precise, comma-separated search queries.
Do not engage in conversation. Do not offer advice. Do not ask questions. Only generate search queries.

Use the following CONTEXT to find relevant brands, styles, and item types.
---
CONTEXT:
{context}
---
USER'S REQUEST:
{question}
---
Based on the user's request and the provided context, generate a list of search queries.
You MUST start your response with the exact phrase "Searching Vinted and Depop for:" and nothing else.
Then, provide a comma-separated list of 3-5 specific and diverse search terms.

Assistant:`;

// ===================================================================================
// --- 1. Define the State for the Graph using a TypeScript interface ---
// ===================================================================================
interface GraphState {
  question: string;
  chat_history: string;
  context?: string;
  generation?: string;
  decision?: "standard_search" | "brand_suggestion";
}

// ===================================================================================
// --- 2. Define the Nodes for the Graph ---
// ===================================================================================

// --- Node: Retrieve Documents ---
async function retrieveContext(state: GraphState): Promise<Partial<GraphState>> {
    
    const { question } = state;
    const docs = await retriever.invoke(question);
    const formattedContext = formatDocs(docs);
    console.log("--- NODE: retrieveContext with DOCS ---");
    return { context: formattedContext };
}

// --- Node: Generate Standard Search Response ---
async function generateStandardSearch(state: GraphState): Promise<Partial<GraphState>> {
    console.log("--- NODE: generateStandardSearch ---");
    const { question, context, chat_history } = state;
    const prompt = ChatPromptTemplate.fromTemplate(FASHION_ASSISTANT_TEMPLATE);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const generation = await chain.invoke({ question, context, chat_history });
    return { generation };
}

// --- ✨ MODIFIED NODE: Generate Brand Suggestion Response ✨ ---
// This node now directly uses the detailed prompt sent from the frontend.
async function generateBrandSuggestion(state: GraphState): Promise<Partial<GraphState>> {
    console.log("--- NODE: generateBrandSuggestion (Specific Brands) ---");
    const { question } = state; // The 'question' contains the full prompt from the frontend.
    
    // We pass the prompt directly to the model as a HumanMessage
    const chain = model.pipe(new StringOutputParser());
    const generation = await chain.invoke([
        new HumanMessage(question)
    ]);

    return { generation };
}


// --- Router Node ---
async function routerNode(state: GraphState): Promise<Partial<GraphState>> {
    console.log("--- NODE: routerNode ---");
    const { question } = state;
    if (question.startsWith("You are a fashion expert and personal shopper.")) {
        console.log("--- ROUTE: Brand Suggestion ---");
        return { decision: "brand_suggestion" };
    }
    console.log("--- ROUTE: Standard Search ---");
    return { decision: "standard_search" };
}

// --- Conditional Edge Function ---
function routeDecision(state: GraphState): "retrieveContext" | "generateBrandSuggestion" | "__end__" {
    if (state.decision === "standard_search") {
        return "retrieveContext";
    } else if (state.decision === "brand_suggestion") {
        return "generateBrandSuggestion";
    }
    return "__end__";
}

// ===================================================================================
// --- 3. Define and Compile the Graph ---
// ===================================================================================

const workflow = new StateGraph<GraphState>({
  channels: {
    question: { value: (x, y) => y, default: () => "" },
    chat_history: { value: (x, y) => y, default: () => "" },
    context: { value: (x, y) => y, default: () => undefined },
    generation: { value: (x, y) => y, default: () => undefined },
    decision: { value: (x, y) => y, default: () => undefined },
  },
});


// Add nodes
workflow.addNode("routerNode", routerNode);
workflow.addNode("retrieveContext", retrieveContext);
workflow.addNode("generateStandardSearch", generateStandardSearch);
workflow.addNode("generateBrandSuggestion", generateBrandSuggestion);

// Define workflow edges
  // Add the @ts-ignore comment on the line immediately before the error
// @ts-ignore
workflow.addEdge(START, "routerNode");
  // Add the @ts-ignore comment on the line immediately before the error
// @ts-ignore
workflow.addConditionalEdges("routerNode", routeDecision);
  // Add the @ts-ignore comment on the line immediately before the error
// @ts-ignore 
workflow.addEdge("retrieveContext", "generateStandardSearch");
  // Add the @ts-ignore comment on the line immediately before the error
// @ts-ignore
workflow.addEdge("generateStandardSearch", END);
  // Add the @ts-ignore comment on the line immediately before the error
// @ts-ignore
workflow.addEdge("generateBrandSuggestion", END);

// Compile the graph
const app = workflow.compile();


// ===================================================================================
// --- 4. The API Handler using the Compiled Graph (Unchanged) ---
// ===================================================================================

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const initialState: GraphState = {
        question: lastMessage.content,
        chat_history: formatVercelMessages(messages.slice(0, -1)),
    };
    
    const stream = await app.stream(initialState, { recursionLimit: 15 });

    const transformStream = new ReadableStream<{ generation?: string }>({
      async start(controller) {
        for await (const chunk of stream) {
            // The last key in the chunk is the node that just executed.
            const nodeName = Object.keys(chunk).pop();
            if(nodeName) {
                const finalState = chunk[nodeName as keyof typeof chunk];
                if (finalState && finalState.generation) {
                    controller.enqueue(finalState.generation);
                }
            }
        }
        controller.close();
      },
    });

    return new StreamingTextResponse(transformStream);

  } catch (e: any) {
    console.error('Error in chat route:', e);
    return new Response(JSON.stringify({ error: e.message || "An unexpected error occurred." }), { status: 500 });
  }
}