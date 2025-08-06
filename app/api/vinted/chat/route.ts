//import { HttpResponseOutputParser } from "langchain/output_parsers";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { StateGraph, END, START } from "@langchain/langgraph";

export const runtime = "edge";

// --- Helper Functions ---
const formatVercelMessages = (messages: VercelChatMessage[]) => {
  return messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
};

const formatDocs = (docs: Document[]) => {
    return docs.map(doc => doc.pageContent).join('\n\n');
};

// --- Initializations ---
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
const retriever = vectorStore.asRetriever(3);
const model = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0.5, streaming: true });

const FASHION_ASSISTANT_TEMPLATE = `You are a conversational AI fashion assistant for Vinted and Depop. Your goal is to help users find the perfect clothing items by creating an outfit idea and then finding it.

**IMPORTANT: First, check if the user's request starts with the phrase "Moodboard items with a".**
- **IF IT DOES:**** Engage in a helpful conversation. Ask clarifying questions about the gender, the type of item (dress, skirt, shirt, shoes etc.), size, personal attributes (height, size), season to gather details. Use the chat history to see what has already been discussed. When you gather the params about user generate search queries. Immediately start your response with the exact phrase "Searching Vinted and Depop for:" and provide a comma-separated list of 3-5 search terms based on the style and brands in the user's request.
- **IF IT DOES NOT:** Follow the logic below.

Follow this logic:
1.  **Analyze the user's request, the provided context, and the chat history.**
2.  **Assess if the request is specific enough.** A specific request includes a style, item type, and other details (e.g., "90s grunge plaid skirt," "bohemian floral maxi dress").
3.  **Engage in a helpful conversation. Ask clarifying questions about their style, occasion, personal attributes (height, size) to gather details. Use the chat history to see what has already been discussed.
4.  **Once you have enough detail to form a concrete outfit idea, your next step is to suggest generating an image.**
    *   First, summarize the outfit you've envisioned based on their preferences.
    *   Then, ask if they would like you to generate an image of this outfit. For example: "I'm thinking of a [description of the outfit]. Would you like me to create an image of that for you?"
    *   You MUST frame this as a question. Your response should end with a question mark.
    *   Do NOT generate search queries yet.
5.  **If the user agrees to image generation, your response MUST start with the exact phrase "Generating image of:"** followed by a detailed description of the outfit.
6.  **Only after the user agrees to the image generation, or if they decline the suggestion, should you generate search queries.** If they decline, generate queries based on the outfit you described.
    *   To generate search queries, you MUST start your response with the exact phrase "Searching Vinted and Depop for:" and nothing else.
    *   Then, provide a comma-separated list of 3-5 specific and diverse search terms.

Use the following CONTEXT to inform your decision and find relevant brands or styles if needed.
---
CONTEXT:
{context}
---
CHAT HISTORY:
{chat_history}
---
USER'S REQUEST:
{question}
---

A:`

// ===================================================================================
// --- Simplified State Interface ---
// ===================================================================================
interface SimpleGraphState {
  question: string;
  chat_history: string;
  context?: string;
  generation?: string;
}

// ===================================================================================
// --- Simplified Node Functions ---
// ===================================================================================

async function retrieveContext(state: SimpleGraphState): Promise<Partial<SimpleGraphState>> {
    console.log("--- NODE: retrieveContext START ---");
    try {
        const { question } = state;
        console.log("Retrieving docs for question:", question?.slice(0, 100) + "...");
        
        const docs = await retriever.invoke(question);
        const formattedContext = formatDocs(docs);
        
        console.log("--- NODE: retrieveContext SUCCESS - Context length:", formattedContext.length);
        console.log("Context preview:", formattedContext.slice(0, 200) + "...");
        
        return { context: formattedContext };
    } catch (error) {
        console.error("--- NODE: retrieveContext ERROR ---", error);
        return { context: "No relevant context found." };
    }
}

async function generateSearchQueries(state: SimpleGraphState): Promise<Partial<SimpleGraphState>> {
    console.log("--- NODE: generateSearchQueries START ---");
    try {
        const { question, context, chat_history } = state;
        console.log("Generating with context length:", context?.length || 0);
        
        const prompt = ChatPromptTemplate.fromTemplate(FASHION_ASSISTANT_TEMPLATE);
        const chain = prompt.pipe(model).pipe(new StringOutputParser());
        
        console.log("Invoking chain for search query generation...");
        const result = await chain.invoke({ 
            question, 
            context: context || "No additional context available.", 
            chat_history: chat_history || "" 
        });
        
        console.log("--- NODE: generateSearchQueries SUCCESS ---");
        console.log("Generated result:", result?.slice(0, 200) + "...");
        
        return { generation: result };
    } catch (error) {
        console.error("--- NODE: generateSearchQueries ERROR ---", error);
        return { generation: "Error generating search queries. Please try again." };
    }
}

// ===================================================================================
// --- Simplified Graph Setup ---
// ===================================================================================

const workflow = new StateGraph<SimpleGraphState>({
  channels: {
    question: { value: (x, y) => y ?? x, default: () => "" },
    chat_history: { value: (x, y) => y ?? x, default: () => "" },
    context: { value: (x, y) => y ?? x, default: () => undefined },
    generation: { value: (x, y) => y ?? x, default: () => undefined },
  },
});

// Add nodes
workflow.addNode("retrieveContext", retrieveContext);
workflow.addNode("generateSearchQueries", generateSearchQueries);

// Simple linear workflow: START → retrieve context → generate queries → END
workflow.addEdge(START, "retrieveContext");
workflow.addEdge("retrieveContext", "generateSearchQueries");
workflow.addEdge("generateSearchQueries", END);

// Compile the graph
const app = workflow.compile();

// ===================================================================================
// --- Simplified API Handler ---
// ===================================================================================

export async function POST(req: Request) {
  console.log("=== SIMPLIFIED API HANDLER START ===");
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    
    console.log("Processing message:", lastMessage?.content?.slice(0, 100) + "...");

    const inputs = {
      question: lastMessage.content,
      chat_history: formatVercelMessages(messages.slice(0, -1)),
    };
    
    console.log("Starting simplified graph execution...");
    console.log("Input state:", JSON.stringify(inputs, null, 2));

    // Run the graph to completion
    const finalState = await app.invoke(inputs);
    console.log("Final state:", JSON.stringify(finalState, null, 2));

    if (finalState.generation) {
      console.log("Returning successful response");
      return new Response(finalState.generation, {
        headers: { 
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache'
        },
      });
    } else {
      console.log("No generation in final state - returning fallback");
      return new Response("No search queries generated. Please try again.", {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

  } catch (e: any) {
    console.error('Error in simplified chat route:', e);
    return new Response(JSON.stringify({ 
      error: e.message || "An unexpected error occurred.",
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ===================================================================================
// --- Optional: Direct function for testing without graph ---
// ===================================================================================

export async function directSearchQuery(question: string, chatHistory: string = '') {
  console.log("=== DIRECT SEARCH FUNCTION ===");
  try {
    // Retrieve context
    const docs = await retriever.invoke(question);
    const context = formatDocs(docs);
    
    // Generate response
    const prompt = ChatPromptTemplate.fromTemplate(FASHION_ASSISTANT_TEMPLATE);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    const result = await chain.invoke({ 
      question, 
      context, 
      chat_history: chatHistory 
    });
    
    return result;
  } catch (error) {
    console.error('Direct search error:', error);
    throw error;
  }
}