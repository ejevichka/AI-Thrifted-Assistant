import { StreamingTextResponse, LangChainStream, Message as VercelChatMessage } from 'ai';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

export const runtime = "edge";

const formatVercelMessages = (messages: VercelChatMessage[]) => {
  return messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
};

// --- Initialize Supabase client and vector store ---
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const vectorStore = new SupabaseVectorStore(
  new OpenAIEmbeddings(), { 
    client: supabaseClient, 
    tableName: "vinted_documents",
    queryName: "match_documents"
  }
);

const FASHION_ASSISTANT_TEMPLATE = `You are a Vinted and Depop fashion expert. Your goal is to help users find clothing by turning their requests into precise search queries.

**Instructions:**
1.  **Analyze the User's Request:** Understand the user's desired style, brand, or item from their question and the chat history.
2.  **Use Context:** Use the retrieved context about brands, styles, and categories to make your search queries more accurate.
3.  **Generate Search Queries:** If the user is looking for items, you MUST respond with a list of search terms.
    * **Start your response with the exact phrase:** \`Searching Vinted and Depop for:\`
    * **Provide comma-separated queries:** e.g., "vintage denim jacket, oversized jean jacket, 90s Levi's jacket"
    * **Be specific:** Include brands, styles (Y2K, Gorpcore), and item types mentioned.
4.  **Answer Directly if Not a Search:** If the user asks a direct question (e.g., "What is Gorpcore?"), answer it using the context. Do not use the "Searching..." prefix.
5.  **Context Limitations:** If you cannot find relevant information in the context, state that you don't have information on that topic. Do not invent information.

---
**Chat History:**
{chat_history}

---
**Retrieved Context (Styles, Brands, Categories):**
{context}

---
**User Question:** {question}

**Assistant:**`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid messages format." }), { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const currentQuestion = lastMessage.content;
    const chatHistory = formatVercelMessages(messages.slice(0, -1));

    const prompt = ChatPromptTemplate.fromTemplate(FASHION_ASSISTANT_TEMPLATE);
    const model = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0.5, streaming: true });

    const retriever = vectorStore.asRetriever(15); // Retrieve 15 relevant documents

    const chain = RunnableSequence.from([
      {
        context: retriever.pipe((docs) => docs.map(d => d.pageContent).join('\n\n')),
        question: () => currentQuestion,
        chat_history: () => chatHistory,
      },
      prompt,
      model,
      new StringOutputParser(),
    ]);

    const { stream, handlers } = LangChainStream();
    chain.invoke({}, { callbacks: [handlers] }).catch(console.error);

    return new StreamingTextResponse(stream);
  } catch (e: any) {
    console.error('Error in chat route:', e);
    return new Response(JSON.stringify({ error: e.message || "An unexpected error occurred." }), { status: 500 });
  }
}