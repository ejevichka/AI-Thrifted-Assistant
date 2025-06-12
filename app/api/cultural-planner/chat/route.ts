import { StreamingTextResponse, LangChainStream } from 'ai';
import { ChatOpenAI } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

// Initialize Supabase client
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize vector store
const vectorStore = new SupabaseVectorStore(
  new OpenAIEmbeddings(),
  { client: supabaseClient, tableName: 'documents' }
);

// Create the prompt template
const promptTemplate = PromptTemplate.fromTemplate(`
You are a Cultural Planner AI assistant. Use the following context to help answer the user's question.
If you don't know the answer, just say that you don't know. Don't try to make up an answer.

Context: {context}

User Question: {question}

Answer: `);

export async function POST(req: Request) {
  const { messages, mood } = await req.json();
  const lastMessage = messages[messages.length - 1];

  // Create a LangChain stream
  const { stream, handlers } = LangChainStream();

  // Initialize the LLM
  const llm = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    streaming: true,
    callbacks: [handlers],
  });

  // Create the RAG chain
  const chain = RunnableSequence.from([
    {
      context: async () => {
        // Perform similarity search based on the user's question and mood
        const searchQuery = `${lastMessage.content} ${mood || ''}`;
        const results = await vectorStore.similaritySearch(searchQuery, 3);
        return results.map((doc) => doc.pageContent).join('\n\n');
      },
      question: () => lastMessage.content,
    },
    promptTemplate,
    llm,
    new StringOutputParser(),
  ]);

  // Run the chain
  chain.invoke({});

  // Return the streaming response
  return new StreamingTextResponse(stream);
} 