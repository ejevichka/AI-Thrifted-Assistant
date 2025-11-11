import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { StateGraph, END, START } from "@langchain/langgraph";
import { AestheticService } from './aesthetic-service';
import { brandMatcher } from './brand-matcher';
import { aestheticMatcher } from '@/app/services/aesthetic-matcher';
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

const FASHION_ASSISTANT_TEMPLATE = `You are DIGGY, a smart fashion discovery AI for Vinted and Depop. Your superpower is finding affordable vintage alternatives to expensive designer brands by matching aesthetic "vibes".

**🎯 YOUR MISSION:**
Help users find fashion items that match their style, but make it AFFORDABLE. Always mix expensive + cheap options in your searches.

**🎨 THE AI AESTHETIC MATRIX (Your Primary Weapon):**

When you see AI AESTHETIC MATRIX in CONTEXT, it means:
1. A luxury brand was detected (e.g., "Rick Owens", "KNWLS")
2. AI has decomposed their style into aesthetic keywords (e.g., "draped silhouette", "asymmetric cut")
3. AI has found AFFORDABLE ALTERNATIVES with match scores (e.g., Aakasha 85%, Imperial 75%)
4. YOU MUST prioritize these AI-curated alternatives - they're specifically trained to match aesthetics

**💡 THE VIBE-ALIKE SYSTEM (Your Secondary Weapon):**

When you see BRAND DATABASE MATCHES in the CONTEXT below, it means:
1. The user mentioned a specific brand (e.g., "KNWLS")
2. I've already found AFFORDABLE VIBE-ALIKES for you (e.g., Miss Sixty, Diesel)
3. YOU MUST include both the original brand + the vibe-alikes in your search queries

**Example:**
User: "Find me a KNWLS jacket"
Context shows: KNWLS → Vibe-alikes: Miss Sixty (60% match), Diesel (55% match)
Your response: "Searching Vinted and Depop for: KNWLS jacket, Miss Sixty jacket, Diesel jacket"

**When you see BRANDS MATCHING YOUR VIBE in CONTEXT:**
It means the user described a style (e.g., "Y2K French brands") without naming brands.
- I've found both TRENDY and AFFORDABLE brands that match
- Prioritize the AFFORDABLE options (💰) in your queries
- Include 1 trendy option if relevant

**🔥 SEARCH QUERY GENERATION RULES:**

1. **Always mix price points:**
   - 1-2 Trendy/Designer brands (inspiration)
   - 2-4 Vintage/Affordable brands (what they can actually buy)

2. **Use the SUGGESTED SEARCH QUERIES as a starting point:**
   - The context includes pre-generated queries
   - You can use these directly or adapt them with item types

3. **Item Types:**
   - If user mentions specific item (jacket, jeans, dress, top, etc.): add it to ALL queries
   - Example: "KNWLS jacket" → "KNWLS jacket", "Miss Sixty jacket", "Diesel jacket"
   - If no item mentioned: use JUST brand names from RECOMMENDED SEARCHES
   - Example: "Y2K vibe" → "Morgan de Toi", "Miss Sixty", "Marine Serre" (NOT "Morgan de Toi y2k")
   - DO NOT add vibe keywords to searches - the brands are already vibe-matched

4. **Query Format:**
   - Keep queries simple: "Brand Name + Item Type"
   - Example: "Diesel jacket", "Miss Sixty low-rise jeans"
   - 3-5 queries total

5. **ALWAYS start search responses with:** "Searching Vinted and Depop for:"
   - Then list comma-separated queries

**📋 CONVERSATION FLOW:**

**IF user's request = "Moodboard items with a [style]":**
→ Generate 3-5 search queries immediately
→ Use brands from BRANDS MATCHING YOUR VIBE section
→ Mix trendy + affordable
→ Start with "Searching Vinted and Depop for:"

**IF specific brand mentioned + specific item:**
→ Generate search queries immediately
→ Use brand + vibe-alikes from BRAND DATABASE MATCHES
→ Add item type to all queries
→ Start with "Searching Vinted and Depop for:"

**IF specific brand mentioned, NO item type:**
→ Generate search queries with brand names only
→ Or ask: "What type of item are you looking for? (jacket, jeans, dress, etc.)"

**IF vague style request (e.g., "minimalist aesthetic") OR moodboard request:**
→ Check BRANDS MATCHING YOUR VIBE in context
→ Use JUST the brand names from RECOMMENDED SEARCHES
→ The brands are already filtered by vibe - no need to add style keywords
→ Start with "Searching Vinted and Depop for:"

**IF very vague (e.g., "help me find clothes"):**
→ Ask clarifying questions:
   - What's your style vibe? (Use examples from AESTHETIC GUIDE)
   - What items do you need?
   - Any favorite brands?

**IF user wants outfit inspiration:**
→ Describe outfit idea
→ Ask: "Would you like me to create an image of this look?"
→ End with question mark

**✨ SPECIAL INSTRUCTIONS IN CONTEXT:**

Pay attention to lines starting with "⚡ INSTRUCTION:" in the context.
These give you specific guidance based on what the user is searching for.

**📊 USE THE CONTEXT SECTIONS:**

1. **AESTHETIC GUIDE** = Style descriptions and aesthetic info
2. **BRAND DATABASE MATCHES** = When user mentions a brand (MUST USE THESE)
3. **BRANDS MATCHING YOUR VIBE** = When user describes a style (USE THESE)
4. **STYLE DATABASE** = Additional style metadata
5. **⚡ INSTRUCTION** = Specific orders for this query

**🎯 QUALITY CHECKLIST:**

Before responding with search queries, verify:
✅ Did I include the original brand (if mentioned)?
✅ Did I include 2-3 affordable vibe-alikes?
✅ Did I add the item type to each query (if mentioned)?
✅ Are my queries simple and searchable?
✅ Did I start with "Searching Vinted and Depop for:"?

**REMEMBER:** Your job is to help users find affordable versions of expensive style. The BRAND DATABASE does the hard work of matching vibes - you just need to use it!

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

RESPONSE:`

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

        // === ENHANCED BRAND MATCHING ===
        // 1. Extract brand mentions
        const extractedBrands = brandMatcher.extractBrandsFromQuery(question);
        let brandContext = '';
        let suggestedQueries: string[] = [];

        // === AESTHETIC MATRIX INTEGRATION ===
        // Use AI-generated aesthetic-brand matrix for luxury → affordable alternatives
        const expandedQuery = aestheticMatcher.expandQuery(question);
        let aestheticMatrixContext = '';

        if (expandedQuery.detectedBrands.length > 0) {
            console.log("Aesthetic Matrix - Detected brands:", expandedQuery.detectedBrands);
            aestheticMatrixContext = '\n\n=== 🎨 AI AESTHETIC MATRIX (Luxury → Affordable Alternatives) ===\n';

            expandedQuery.detectedBrands.forEach(brandName => {
                const results = aestheticMatcher.findAlternativesForBrand(brandName);

                if (results.length > 0) {
                    results.forEach(result => {
                        aestheticMatrixContext += `\n🏷️  ${result.luxuryBrand} (${result.aesthetic} aesthetic):\n`;
                        aestheticMatrixContext += `   Style Keywords: ${result.aestheticKeywords.join(', ')}\n`;
                        aestheticMatrixContext += `\n   💰 AFFORDABLE ALTERNATIVES (AI-curated):\n`;

                        result.alternatives.forEach((alt, index) => {
                            aestheticMatrixContext += `     ${index + 1}. ${alt.name} (${alt.matchScore}% match)\n`;
                            aestheticMatrixContext += `        Shared: ${alt.sharedKeywords.join(', ')}\n`;
                            aestheticMatrixContext += `        Search: ${alt.searchTerms.slice(0, 2).join(', ')}\n`;
                        });

                        // Add search terms to suggested queries
                        result.alternatives.forEach(alt => {
                            suggestedQueries.push(...alt.searchTerms.slice(0, 2));
                        });
                    });
                }
            });
        }

        // Add aesthetic keywords if detected
        if (expandedQuery.aestheticKeywords.length > 0) {
            aestheticMatrixContext += `\n🔑 Aesthetic Keywords: ${expandedQuery.aestheticKeywords.slice(0, 5).join(', ')}\n`;
        }

        if (extractedBrands.length > 0) {
            console.log("Found brands in query:", extractedBrands);
            brandContext = '\n\n=== BRAND DATABASE MATCHES ===\n';

            extractedBrands.forEach(brandName => {
                const brand = brandMatcher.findBrand(brandName);
                if (brand) {
                    brandContext += `\n${brand.brand}:\n`;
                    brandContext += `  Category: ${brand.category}\n`;
                    brandContext += `  Vibe Tags: ${brand.vibeTags.join(', ')}\n`;
                    brandContext += `  Price Range: ${brand.priceRange}\n`;

                    // Find vibe-alikes with detailed matching info
                    const vibeAlikes = brandMatcher.findVibeAlikeBrands(brandName, {
                        limit: 5,
                        minScore: 0.2
                    });

                    if (vibeAlikes.length > 0) {
                        brandContext += `\n  💡 AFFORDABLE VIBE-ALIKES:\n`;
                        vibeAlikes.forEach((match, index) => {
                            const matchPercent = Math.round(match.matchScore * 100);
                            brandContext += `    ${index + 1}. ${match.brand}\n`;
                            brandContext += `       - Match: ${matchPercent}% (${match.sharedTags.join(', ')})\n`;
                            brandContext += `       - Price: ${match.priceRange}\n`;
                        });

                        // Generate example search queries
                        brandContext += `\n  📝 SUGGESTED SEARCH QUERIES:\n`;
                        const exampleQueries = brandMatcher.generateAugmentedSearchQueries(
                            brandName,
                            undefined, // Will extract from question context
                            3
                        );
                        exampleQueries.forEach((query, index) => {
                            brandContext += `    ${index + 1}. "${query}"\n`;
                            suggestedQueries.push(query);
                        });
                    }

                    // If brand is affordable, suggest similar affordable options
                    if (brand.category === 'Vintage/Affordable') {
                        const similarAffordable = brandMatcher.findBrandsByVibeTags(
                            brand.vibeTags,
                            { limit: 3, category: 'Vintage/Affordable' }
                        ).filter(b => b.brand !== brand.brand);

                        if (similarAffordable.length > 0) {
                            brandContext += `\n  🔍 SIMILAR AFFORDABLE BRANDS:\n`;
                            similarAffordable.forEach((match, index) => {
                                brandContext += `    ${index + 1}. ${match.brand} (${match.sharedTags.join(', ')})\n`;
                            });
                        }
                    }
                }
            });
        }

        // 2. Extract vibe tags from query (even without brand names)
        const queryLower = question.toLowerCase();
        const detectedVibeTags: string[] = [];

        // Check for vibe tag keywords
        const vibeTagKeywords = [
            'y2k', '90s', '80s', 'vintage',
            'minimalist', 'maximalist', 'streetwear', 'goth', 'grunge', 'punk',
            'gorpcore', 'techwear', 'coquette', 'cottagecore', 'balletcore',
            'french', 'italian', 'scandinavian', 'japanese'
        ];

        vibeTagKeywords.forEach(keyword => {
            if (queryLower.includes(keyword)) {
                // Map keywords to actual vibe tags
                if (keyword === 'french') detectedVibeTags.push('french_chic');
                else if (keyword === 'italian') detectedVibeTags.push('italian_vintage');
                else if (keyword === 'scandinavian') detectedVibeTags.push('scandi_minimalism');
                else if (keyword === 'japanese') detectedVibeTags.push('japanese_streetwear', 'japanese_minimalism');
                else detectedVibeTags.push(keyword);
            }
        });

        // 3. If vibe tags detected, suggest brands
        if (detectedVibeTags.length > 0 && extractedBrands.length === 0) {
            console.log("Detected vibe tags:", detectedVibeTags);
            brandContext += '\n\n=== BRANDS MATCHING YOUR VIBE ===\n';

            const matchingBrands = brandMatcher.findBrandsByVibeTags(
                detectedVibeTags,
                { limit: 10, minTagMatch: 1, category: 'all' }
            );

            // Group by category
            const trendyBrands = matchingBrands.filter(b => b.category === 'Trendy/Designer').slice(0, 3);
            const affordableBrands = matchingBrands.filter(b => b.category === 'Vintage/Affordable').slice(0, 5);

            if (trendyBrands.length > 0) {
                brandContext += `\n  🌟 TRENDY/DESIGNER OPTIONS:\n`;
                trendyBrands.forEach((match, index) => {
                    brandContext += `    ${index + 1}. ${match.brand} (${match.sharedTags.join(', ')})\n`;
                });
            }

            if (affordableBrands.length > 0) {
                brandContext += `\n  💰 AFFORDABLE/VINTAGE OPTIONS:\n`;
                affordableBrands.forEach((match, index) => {
                    brandContext += `    ${index + 1}. ${match.brand} (${match.sharedTags.join(', ')}) - ${match.priceRange}\n`;
                });
            }

            // Suggest search queries based on vibe
            brandContext += `\n  📝 RECOMMENDED SEARCHES:\n`;
            const topBrands = [...affordableBrands.slice(0, 3), ...trendyBrands.slice(0, 1)];
            topBrands.forEach((match, index) => {
                // Just use brand name - they're already filtered by vibe tags
                // Adding vibe keywords can over-constrain Vinted searches
                const query = match.brand;
                brandContext += `    ${index + 1}. "${query}"\n`;
                suggestedQueries.push(query);
            });
        }

        // Use styles data as additional context
        const stylesContext = JSON.stringify(stylesData).slice(0, 600); // Reduced to make room for brand context

        // Combine contexts with clear structure
        let combinedContext = '';

        if (aestheticContext) {
            combinedContext += '=== AESTHETIC GUIDE ===\n' + aestheticContext + '\n';
        }

        // Add AI-generated aesthetic matrix first (priority)
        if (aestheticMatrixContext) {
            combinedContext += aestheticMatrixContext + '\n';
        }

        if (brandContext) {
            combinedContext += brandContext + '\n';
        }

        if (stylesContext) {
            combinedContext += '\n=== STYLE DATABASE ===\n' + stylesContext;
        }

        // Add smart instructions based on what we found
        if (extractedBrands.length > 0) {
            combinedContext += `\n\n⚡ INSTRUCTION: User mentioned ${extractedBrands.join(', ')}. Include BOTH the original brand AND at least 2-3 affordable vibe-alike alternatives in your search queries.`;
        }

        if (detectedVibeTags.length > 0) {
            combinedContext += `\n\n⚡ INSTRUCTION: User wants ${detectedVibeTags.join(', ')} style. Use the brands listed above that match these vibes.`;
        }

        console.log("--- NODE: retrieveContext SUCCESS ---");
        console.log("Context length:", combinedContext.length);
        console.log("Extracted brands:", extractedBrands);
        console.log("Detected vibe tags:", detectedVibeTags);
        console.log("Suggested queries:", suggestedQueries);

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