import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { StateGraph, END, START } from "@langchain/langgraph";
import { AestheticService } from './aesthetic-service';
import stylesData from '../../../../data/vinted/styles.json';

export const runtime = "edge";

// --- Helper Functions ---
const formatVercelMessages = (messages: VercelChatMessage[]) => {
  return messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
};


// --- Initializations ---
const model = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0.5, streaming: true });

const FASHION_ASSISTANT_TEMPLATE = `You are a conversational AI fashion assistant for Vinted and Depop. Your goal is to help users find the perfect clothing items by creating an outfit idea and then finding it.

**IMPORTANT: First, check if the user's request starts with the phrase "Moodboard items with a".**
- **IF IT DOES:** Your main goal is to generate a list of 3-5 diverse and specific search queries based on the user's request and the provided CONTEXT.

Follow this logic:
1.  **Identify the core aesthetic style** from the user's request (e.g., Y2K, Grunge, Minimalist, Streetwear).
2.  **Consult the FASHION AESTHETIC GUIDE** in the CONTEXT to find the brands and items associated with that style. This guide provides:
    - Style descriptions and key characteristics
    - Specific clothing items for each aesthetic
    - Recommended brands that match the aesthetic
    - Alternative names for the style
3.  **Extract any item types** mentioned by the user. If none mentioned, use the "Key Items" from the aesthetic guide.
4.  **Construct search queries by combining recommended brands with relevant items** from the aesthetic guide. For example: "Arc'teryx fleece jacket" or "Supreme streetwear hoodie".
5.  **Use ONLY the brands and items listed in the FASHION AESTHETIC GUIDE** - do not invent associations.
6.  **Prioritize specific, searchable terms** over generic ones.
7.  **Start your response with "Searching Vinted and Depop for:"** followed by the comma-separated search terms.
- **IF IT DOES NOT:** Follow the logic below.

Follow this logic:
1.  **Analyze the user's request using the FASHION AESTHETIC GUIDE** to understand style preferences.
2.  **Assess specificity:** A specific request includes style + item type + details (e.g., "minimalist cashmere sweater," "Y2K low-rise jeans").
3.  **For vague requests:** Ask clarifying questions about:
    - **Style preference** (reference the aesthetics in the guide: minimalist, streetwear, bohemian, etc.)
    - **Specific items needed** (use the key items from relevant aesthetics)
    - **Occasion and fit preferences**
4.  **When enough details are gathered:**
    - Summarize the outfit using terminology from the aesthetic guide
    - Ask: "I'm thinking of a [detailed outfit description]. Would you like me to create an image of this look?"
    - **Must end with a question mark**
5.  **For image generation:** Start with "Generating image of:" + detailed description
6.  **For search queries:** Use "Searching Vinted and Depop for:" + 3-5 specific terms combining:
    - Brands from the aesthetic guide
    - Key items from the aesthetic guide
    - User-specified details

**Use the FASHION AESTHETIC GUIDE as your primary reference for style associations, brands, and terminology.**

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
        console.log("Retrieving context for question:", question?.slice(0, 100) + "...");
        
        // Get aesthetic context
        const aestheticContext = AestheticService.generateEnhancedContext(question);
        
        // Use styles data as additional context
        const stylesContext = JSON.stringify(stylesData).slice(0, 1000); // Limit size
        
        // Combine contexts
        let combinedContext = aestheticContext;
        if (stylesContext) {
            combinedContext = `${aestheticContext}\n\nADDITIONAL STYLES DATA:\n${stylesContext}`;
        }
        
        console.log("--- NODE: retrieveContext SUCCESS - Context length:", combinedContext.length);
        console.log("Aesthetic context preview:", aestheticContext.slice(0, 200) + "...");
        
        return { context: combinedContext };
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
// @ts-ignore
workflow.addEdge(START, "retrieveContext");
// @ts-ignore
workflow.addEdge("retrieveContext", "generateSearchQueries");
// @ts-ignore
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
      // @ts-ignore
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

async function directSearchQuery(question: string, chatHistory: string = '') {
  console.log("=== DIRECT SEARCH FUNCTION ===");
  try {
    // Get aesthetic context
    const aestheticContext = AestheticService.generateEnhancedContext(question);
    
    // Use styles data as context
    const stylesContext = JSON.stringify(stylesData).slice(0, 1000);
    
    // Combine contexts
    let combinedContext = aestheticContext;
    if (stylesContext) {
      combinedContext = `${aestheticContext}\n\nADDITIONAL STYLES DATA:\n${stylesContext}`;
    }
    
    // Generate response
    const prompt = ChatPromptTemplate.fromTemplate(FASHION_ASSISTANT_TEMPLATE);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    const result = await chain.invoke({ 
      question, 
      context: combinedContext, 
      chat_history: chatHistory 
    });
    
    return result;
  } catch (error) {
    console.error('Direct search error:', error);
    throw error;
  }
}