# AI-Thrifted-Assistant (DIGGY)

## Project Overview

**DIGGY** is an AI-powered fashion discovery assistant that helps users find second-hand clothing on Vinted and Depop marketplaces. The application combines conversational AI, computer vision, and Retrieval-Augmented Generation (RAG) to provide intelligent fashion recommendations based on aesthetic preferences, brand knowledge, and style trends.

### Key Features

- **Conversational Fashion Search**: Natural language chat interface powered by GPT-4o-mini
- **Image-Based Search**: Upload fashion images to find similar items using GPT-4o vision analysis
- **AI Image Generation**: Generate outfit inspiration images using DALL-E
- **Aesthetic-Based Discovery**: Search by fashion aesthetics (Y2K, Grunge, Streetwear, etc.)
- **Brand Intelligence**: Curated database of brands mapped to specific aesthetics
- **Smart Filtering**: Filter results by price range and size
- **RAG-Enhanced Recommendations**: Vector-based semantic search using fashion knowledge base
- **Real-time Product Search**: Live scraping of Vinted marketplace
- **Session History**: Maintain conversation context for personalized recommendations

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: React hooks + Vercel AI SDK
- **Notifications**: Sonner toast notifications

### Backend
- **Runtime**: Node.js 18+ with Edge Runtime support
- **API Routes**: Next.js API routes (serverless functions)
- **AI Orchestration**: LangChain.js with LangGraph
- **LLM Provider**: OpenAI (GPT-4o, GPT-4o-mini, DALL-E 3)
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Vector Database**: Supabase (PostgreSQL + pgvector extension)

### Data & Services
- **External APIs**: Vinted API (web scraping)
- **Data Sources**:
  - Fashion aesthetics database (styles, brands, trends)
  - Social media trends (CSV datasets)
  - Custom scraped fashion data

### Development Tools
- **Language**: TypeScript
- **Package Manager**: Yarn 3.5.1
- **Linting**: ESLint
- **Formatting**: Prettier

## Project Structure

```
AI-Thrifted-Assistant/
├── app/
│   ├── api/
│   │   ├── vinted/
│   │   │   ├── chat/
│   │   │   │   ├── route.ts              # Main chat endpoint with LangGraph
│   │   │   │   ├── aesthetic-service.ts  # Aesthetic tag matching service
│   │   │   │   ├── brands-data.ts        # Brand classification data
│   │   │   │   └── tags-data.ts          # Fashion aesthetic tags data
│   │   │   ├── search-external/route.ts  # Vinted/Depop product search
│   │   │   ├── image-search/route.ts     # Image analysis endpoint
│   │   │   ├── image-generation/route.ts # DALL-E image generation
│   │   │   ├── ingest/route.ts           # Data ingestion to vector DB
│   │   │   ├── ingest-status/route.ts    # Check ingestion status
│   │   │   └── brands/route.ts           # Brand information API
│   │   └── retrieval/
│   │       └── ingest/route.ts           # Alternative ingestion route
│   ├── components/
│   │   ├── hooks/
│   │   │   └── useProductFetcher.ts      # Product search hook
│   │   ├── ChatSection.tsx               # Chat interface
│   │   ├── ImageSearchSection.tsx        # Image upload UI
│   │   ├── ProductResults.tsx            # Product grid display
│   │   ├── ProductFilters.tsx            # Filter controls
│   │   ├── StyleSidebar.tsx              # Quick style selection
│   │   ├── MoodboardGenerator.tsx        # Moodboard creation
│   │   └── IngestionSection.tsx          # Data ingestion UI
│   ├── types/
│   │   └── index.ts                      # TypeScript type definitions
│   ├── styles/
│   │   └── pinterest.css                 # Custom Pinterest-style grid
│   ├── layout.tsx                        # Root layout
│   ├── page.tsx                          # Main home page
│   ├── brands/page.tsx                   # Brands page
│   └── moodboard/page.tsx                # Moodboard page
├── data/
│   ├── vinted/
│   │   ├── styles.json                   # Fashion styles database
│   │   ├── brands.json                   # Brand classifications
│   │   ├── materials.json                # Material types
│   │   └── vinted-dataset/               # Scraped product data
│   ├── scrapped/                         # Additional scraped data
│   ├── social_media_trends.csv           # Social media trend data
│   └── Cleaned_Viral_Social_Media_Trends.csv
├── public/
│   ├── fonts/                            # Custom fonts
│   └── images/                           # Static images
├── scripts/
│   └── scrape-vinted.ts                  # Vinted scraping script
├── utils/                                # Utility functions
├── supabase/
│   └── migrations/                       # Database migrations
├── components/
│   └── ui/                               # Shared UI components
├── .env                                  # Environment variables
├── .env.example                          # Environment template
├── next.config.js                        # Next.js configuration
├── tailwind.config.js                    # Tailwind configuration
├── tsconfig.json                         # TypeScript configuration
└── package.json                          # Dependencies
```

## Architecture

### AI Pipeline Architecture

#### 1. Text-Based Search Flow
```
User Message → Chat API → LangGraph Workflow
                           ↓
                    Retrieve Context (Aesthetic Service)
                           ↓
                    Generate Search Queries (GPT-4o-mini)
                           ↓
                    Search External API (Vinted)
                           ↓
                    Apply Filters (Price, Size)
                           ↓
                    Return Products → Frontend Display
```

#### 2. Image-Based Search Flow
```
User Image Upload → Image Search API → GPT-4o Vision Analysis
                                       ↓
                                Extract Style/Items
                                       ↓
                                Generate Search Queries
                                       ↓
                                Search External API
                                       ↓
                                Return Products
```

#### 3. Image Generation Flow
```
User Request → Chat API → Detect Image Generation Intent
                          ↓
                    DALL-E 3 API Call
                          ↓
                    Return Generated Image
                          ↓
                    Offer to Search for Similar Items
```

### LangGraph State Machine

The chat endpoint uses LangGraph to orchestrate a multi-step AI workflow:

1. **retrieveContext**: Matches user query to aesthetic tags and retrieves relevant brands/items
2. **generateSearchQueries**: Uses LLM with context to generate 3-5 specific search terms
3. **Stream Response**: Returns queries to frontend for product search

### Data Ingestion & RAG

- Fashion data from JSON files is chunked using `RecursiveCharacterTextSplitter`
- Text chunks are embedded using OpenAI embeddings (1536-dimensional vectors)
- Embeddings stored in Supabase with pgvector extension
- Retrieval uses cosine similarity search via `match_documents` function

### Aesthetic Service

Custom intelligent matching system that:
- Analyzes user queries for aesthetic keywords
- Maps aesthetics to appropriate brands (e.g., "Y2K" → Naf Naf, Kookai, etc.)
- Extracts clothing item types from natural language
- Generates optimized search queries combining brands + aesthetics + items
- Provides context to LLM for better recommendations

### Product Search & Filtering

**Search Strategy:**
- Sequential search for multiple queries with deduplication
- Retry logic with exponential backoff for rate limiting
- Cookie management for Vinted API access
- User-agent rotation to avoid blocking

**Filtering:**
- Client-side and server-side price range filtering
- Size matching with fuzzy string comparison
- Result shuffling for variety

## Key Components

### Frontend Components

#### `VintedHomePage` (app/page.tsx)
Main application page coordinating:
- Chat interface with message history
- Image upload and processing
- Product results grid
- Filter controls
- Automatic data ingestion on first load

#### `ChatSection`
- Message display with markdown rendering
- User input with brand suggestion feature
- Image attachment support
- Loading states for AI processing

#### `ProductResults`
Pinterest-style masonry grid displaying:
- Product images
- Title, price, brand, size
- Platform badge (Vinted/Depop)
- Direct links to listings

#### `useProductFetcher` Hook
Custom hook managing:
- Product search state
- Deduplication logic
- Error handling
- Loading states

### Backend Services

#### Chat Route (`/api/vinted/chat/route.ts`)
- LangGraph-based conversation flow
- Aesthetic context retrieval
- Query generation with GPT-4o-mini
- Streaming response support

#### Search External Route (`/api/vinted/search-external/route.ts`)
- Multi-query search orchestration
- Vinted API integration with retry logic
- Product deduplication
- Filter application (price, size)
- Result shuffling

#### Image Search Route (`/api/vinted/image-search/route.ts`)
- Image upload handling
- GPT-4o vision analysis
- Style and item extraction
- Search query generation

#### Aesthetic Service (`aesthetic-service.ts`)
Intelligent context generation:
- Tag scoring based on relevance
- Brand-aesthetic associations
- Clothing item extraction
- Search query optimization

## Data Models

### Product Interface
```typescript
interface Product {
  id: string;
  title: string;
  price: string;
  priceNumeric?: number;
  imageUrl: string;
  condition: string;
  link: string;
  platform: 'Vinted' | 'Depop';
  brand?: string;
  size?: string;
}
```

### Aesthetic Tag Structure
```typescript
interface AestheticTag {
  tag_name: string;          // e.g., "Y2K"
  description: string;        // Style description
  keywords: string;           // Semicolon-separated items
  aka: string;               // Alternative names
  recommended_brands: string; // Associated brands
}
```

### Filter State
```typescript
interface FilterState {
  priceRange: { min: number | null; max: number | null };
  sizes: string[];
}
```

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# OpenAI API (required)
OPENAI_API_KEY="sk-..."

# Supabase (required for RAG features)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="xxx"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxx"

# Optional: LangSmith tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY="xxx"
LANGCHAIN_PROJECT="ai-thrifted-assistant"
```

## Setup Instructions

### 1. Install Dependencies
```bash
yarn install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Set Up Supabase

Create a new Supabase project and run these SQL commands:

**Enable pgvector:**
```sql
create extension if not exists vector with schema extensions;
```

**Create documents table:**
```sql
create table public.vinted_documents (
  id uuid not null default gen_random_uuid(),
  content text null,
  metadata jsonb null,
  embedding vector(1536) null,
  constraint vinted_documents_pkey primary key (id)
) tablespace pg_default;
```

**Create search function:**
```sql
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

### 4. Run Data Ingestion
```bash
yarn dev
# Navigate to http://localhost:3000
# Click "Ingest Vinted Datasets" button (happens automatically on first load)
```

### 5. Start Development Server
```bash
yarn dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

```bash
yarn dev              # Start development server
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Run ESLint
yarn format           # Format code with Prettier
yarn scrape:vinted    # Run Vinted scraping script
```

## Features in Detail

### Conversational AI Chat

The chat interface supports:
- **Natural language queries**: "Find me Y2K low-rise jeans"
- **Style recommendations**: "Suggest brands for minimalist aesthetic"
- **Outfit generation**: "Create a streetwear outfit"
- **Image generation**: AI generates outfit visuals
- **Session memory**: Maintains conversation context

### Aesthetic-Based Search

DIGGY understands fashion aesthetics:
- **Y2K**: Naf Naf, Kookai, vintage Guess
- **Streetwear**: Supreme, Stüssy, Carhartt WIP
- **Minimalist**: COS, Everlane, Arket
- **Grunge**: Carhartt, Dickies, Dr. Martens
- **Gorpcore**: Arc'teryx, Salomon, Patagonia
- And many more...

### Brand Intelligence

- 100+ classified brands across multiple aesthetics
- Brand-aesthetic association scoring
- Automatic brand suggestion based on user preferences

### Smart Filtering

- **Price Range**: Set min/max price limits
- **Size Selection**: Multi-select size filtering
- Real-time filter application without re-searching

### Image Search

Upload any fashion image to:
1. Analyze style, items, colors, and vibes
2. Generate targeted search queries
3. Find similar items on Vinted

## Current Limitations

1. **Platform Support**: Currently only Vinted is fully functional (Depop integration pending)
2. **Rate Limiting**: Vinted API requests may be throttled during heavy usage
3. **Geographic Scope**: Primarily searches Vinted Germany (vinted.de)
4. **Image Generation**: Requires OpenAI API with DALL-E access

## Future Roadmap

- [ ] Full Depop integration
- [ ] Multi-region support (UK, FR, US marketplaces)
- [ ] Saved searches and favorites
- [ ] User authentication and profiles
- [ ] Outfit builder with mix-and-match
- [ ] Price tracking and alerts
- [ ] Browser extension for direct marketplace integration
- [ ] Mobile app (React Native)
- [ ] Social features (share finds, collaborative moodboards)

## Development Notes

### LangChain Integration

The application uses LangChain's latest features:
- **StateGraph**: For complex multi-step AI workflows
- **SupabaseVectorStore**: For RAG implementation
- **ChatPromptTemplate**: For dynamic prompt engineering
- **StringOutputParser**: For streaming responses

### Edge Runtime Compatibility

The chat API uses Edge Runtime for:
- Faster cold starts
- Lower latency
- Better streaming support

### Cookie Management for Vinted

The Vinted scraper:
1. Fetches homepage to obtain cookies
2. Uses cookies for API authentication
3. Implements retry logic with exponential backoff
4. Rotates user agents to avoid detection

### Debugging

Enable verbose logging:
```typescript
console.log statements throughout API routes
LangSmith tracing (set LANGCHAIN_TRACING_V2=true)
```

## Contributing

This is a personal project by **Nat** for exploring AI-powered fashion discovery.

## License

See LICENSE file for details.

## Credits

- **AI Models**: OpenAI GPT-4o, GPT-4o-mini, DALL-E 3
- **Vector DB**: Supabase with pgvector
- **Framework**: Next.js, React
- **UI Components**: Radix UI, Tailwind CSS
- **AI Orchestration**: LangChain.js

---

**Project Status**: Active development (Feature/refactor-tags branch)

**Last Updated**: October 2025
