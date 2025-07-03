# AI Fashion Discovery Engine for Vinted & Depop

This project is an AI-powered fashion discovery engine that provides an intelligent search layer over the Vinted and Depop marketplaces. It translates intuitive, human-friendly prompts—like abstract styles or images—into precise, effective search queries, aggregating live results from both platforms.

## Core Features

- **Style Prompt Generator (AI Chat)**: Chat with an AI fashion assistant in natural language (e.g., "Futuristic, Coquette, Whimsygoth"). The AI uses a Retrieval-Augmented Generation (RAG) pipeline to understand styles and generates precise search queries to find matching items.
- **AI-Powered Image Search**: Upload any image of an outfit or clothing item. The application uses a multi-modal AI model (GPT-4o) to analyze the visual content and generates relevant search terms to find similar items for sale.
- **Live Product Aggregation**: Fetches real-time product listings from both Vinted and Depop using the Apify platform. It then transforms and displays the results in a unified, easy-to-browse grid.
- **One-Click Data Ingestion**: A simple UI allows the admin to load and vectorize foundational data (styles, brands, categories) into the AI's memory (Supabase Vector DB) with a single click.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Frontend**: React, Tailwind CSS
- **AI & Orchestration**: LangChain.js, Vercel AI SDK
- **Backend**: Next.js API Routes (Node.js & Edge Runtimes)
- **Vector Database**: Supabase (PostgreSQL with pgvector)
- **External Services**:
  - OpenAI: GPT-4o for vision and chat, text-embedding-3-small for embeddings
  - Apify: For live web scraping of Vinted and Depop

## How It Works

The application leverages two primary AI-driven workflows:

### Text Search Flow
```
User Prompt → Chat API → RAG (Supabase) → AI Query Generation → External Search API → Apify → Frontend Grid
```

### Image Search Flow
```
User Image → Image Search API → AI Vision Analysis → AI Query Generation → External Search API → Apify → Frontend Grid
```

## Getting Started

Follow these instructions to set up and run the project locally.

### 1. Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Accounts for:
  - OpenAI
  - Supabase
  - Apify

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Environment Variables

Create a file named `.env.local` in the root of your project by copying the example file:

```bash
cp .env.local.example .env.local
```

Now, open `.env.local` and fill in the values for each variable:

```env
# OpenAI API Key
OPENAI_API_KEY="sk-..."

# Supabase Credentials (from your Supabase project settings -> API)
NEXT_PUBLIC_SUPABASE_URL="https://your-project-url.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Apify API Token (from your Apify account -> Settings -> Integrations)
APIFY_TOKEN="your-apify-token"
```

### 5. Set Up Supabase Database

Go to your Supabase project dashboard.

Navigate to the SQL Editor and click New query.

Run the following SQL commands one by one to enable the vector extension and create the necessary table and search function.

#### Enable Vector Extension:

```sql
-- Enable the pgvector extension
create extension if not exists vector with schema extensions;
```

#### Create Documents Table:

```sql
-- Create the table for storing vectorized data
create table
  public.vinted_documents (
    id uuid not null default gen_random_uuid (),
    content text null,
    metadata jsonb null,
    embedding vector(1536) null,
    constraint vinted_documents_pkey primary key (id)
  ) tablespace pg_default;
```

#### Create Search Function:

```sql
-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int,
  filter jsonb
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from vinted_documents
  where metadata @> filter
  order by embedding <=> query_embedding
  limit match_count;
end;
$$;
```

### 6. Run Data Ingestion

Before you can chat with the AI, you must populate its memory.

1. Start the development server:
```bash
npm run dev
```

2. Open your browser to http://localhost:3000
3. Click the "Ingest Vinted Datasets" button
4. Wait for the progress bar to reach 100% and show a success message. This process will read the JSON files in the /data directory and store their vector embeddings in your Supabase database.

### 7. Run the Application

You're all set! With the server running and the data ingested, you can now use the chat and image search features.

```bash
npm run dev
```

## API Endpoints

The core backend logic is handled by these API routes:

- `/api/vinted/ingest`: Processes and vectorizes local data files into the Supabase DB
- `/api/vinted/chat`: Handles chat requests, performs RAG, and generates search queries
- `/api/vinted/image-search`: Analyzes an uploaded image with a vision model and generates search queries
- `/api/vinted/search-external`: Takes search queries and executes live scraping jobs on Vinted and Depop via Apify

### Summary of LangChain Features Utilized in the Vinted AI Fashion Discovery Engine

Vector Store Integration
SupabaseVectorStore was implemented to store and retrieve vector embeddings of fashion-related data such as brands, styles, and sizes. This forms the foundation of the Retrieval-Augmented Generation (RAG) pipeline, enabling efficient semantic search.

Embeddings
OpenAIEmbeddings were applied to convert textual data (e.g., brand names, style descriptions) into high-dimensional vectors. These vectors are stored in the vector database to support similarity search operations.

Retrievers
The .asRetriever() method was used on the vector store to generate a retriever object. This retriever fetches the most relevant documents based on the user’s query, powering the core of the retrieval system.

Prompt Templates
ChatPromptTemplate was utilized to dynamically assemble prompts for the language model. This includes injecting retrieved context, chat history, and the user’s question into a structured format.

RunnableSequence (Chains)
RunnableSequence.from([...]) was employed to orchestrate a multi-step chain consisting of:

Document retrieval

Prompt formatting

Language model invocation

Output parsing

Output Parsing
StringOutputParser was integrated to process the raw output from the language model, converting it into a clean string format suitable for frontend streaming.

Text Splitting
RecursiveCharacterTextSplitter was used during data ingestion to divide large documents into smaller, overlapping chunks. This enhances embedding quality and retrieval granularity.

Streaming Responses
LangChainStream was set up to stream the language model’s responses to the frontend in real time, creating a smooth and responsive chat interface.

LangChain’s components for vector storage, embeddings, retrieval, prompt templating, chain execution, output parsing, document chunking, and real-time streaming were combined to deliver a robust and efficient RAG-based AI discovery experience for the Vinted fashion platform.