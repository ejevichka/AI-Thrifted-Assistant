'use client';

import React, { useState, useRef, FormEvent } from 'react';
import { useChat, Message } from 'ai/react';
import StyleSidebar from '../StyleSidebar';
import ChatSection from '../ChatSection';
import ProductResults from '../ProductResults';
import { VintedFilters, VintedFilterState } from '../VintedFilters';
import { useProductFetcher } from '../hooks/useProductFetcher';
import { aestheticMatcher } from '@/app/services/aesthetic-matcher';
import { toast } from 'sonner';
import { useVibeDNASearch } from '@/app/hooks/useVibeDNASearch';
import MagicLoader from '../MagicLoader';

interface DigByMoodboardScreenProps {
  onBack: () => void;
  gradient: string;
  accentColor: string;
}

export const DigByMoodboardScreen: React.FC<DigByMoodboardScreenProps> = ({
  onBack,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  // Product Fetcher Hook
  const {
    products: aggregatedProducts,
    isLoading: isLoadingProducts,
    error: productSearchError,
    searchInitiated,
    progressMessage,
    fetchProducts,
  } = useProductFetcher();

  // VibeDNA Search Hook
  const {
    getStyleBrandQueries,
    isLoading: isVibeDNALoading,
    error: vibeDNAError
  } = useVibeDNASearch();

  // Vinted Filter State
  const [vintedFilters, setVintedFilters] = useState<VintedFilterState>({
    order: 'relevance', // Use relevance for curated, high-quality results
    priceRange: { min: null, max: null },
    sizes: [],
    brands: [],
    categories: [],
    materials: [],
    colors: [],
    conditions: [],
  });
  const [lastSearchQueries, setLastSearchQueries] = useState<string[]>([]);

  const { messages, input, handleInputChange, handleSubmit, setMessages, setInput } = useChat({
    api: '/api/vinted/chat',
    streamMode: "text",
    onError: (e) => toast.error(`Error while processing your request`, { description: e.message }),
    onFinish: (message) => {
      console.log('AI Chat Response:', message.content);
      const searchTrigger = "Searching Vinted and Depop for:";
      if (message.content.startsWith(searchTrigger)) {
        const queryPart = message.content.substring(searchTrigger.length).trim();
        const queries = queryPart.split(',').map(q => q.trim()).filter(q => q.length > 0);
        if (queries.length > 0) {
          console.log("AI suggested search queries, triggering product search:", queries);
          setLastSearchQueries(queries);
          fetchProducts(queries, vintedFilters).then(() => {
            // Scroll to products after search completes
            setTimeout(() => {
              productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
          });
        }
      }
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBrandSuggestion = (e: FormEvent) => {
    e.preventDefault();
  };

  const handleImageGeneration = async (prompt: string) => {
    // Placeholder
  };

  const handleUserChoice = (choice: 'yes' | 'no') => {
    // Placeholder
  };

  const scrollToChatInput = () => {
    chatInputRef.current?.focus();
    chatInputRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Direct search handler for style cards (VibeDNA-powered)
  const handleStyleClick = async (styleId: string, hashtags: string[]) => {
    console.log(`🧬 VibeDNA search for style: ${styleId}`);

    try {
      // styleId is already in the correct format (comes from styles-enhanced.json)

      // Use VibeDNA vector search to get AI-curated brands
      const brandQueries = await getStyleBrandQueries(styleId, 10);

      if (brandQueries.length > 0) {
        console.log(`✅ VibeDNA found ${brandQueries.length} brands for ${styleId}:`, brandQueries);

        // Trigger product search with AI-curated brands
        // AI-Ranker enabled with SSE streaming for real-time progress
        setLastSearchQueries(brandQueries);
        fetchProducts(brandQueries, vintedFilters, true, styleId); // ✅ AI-Ranker enabled

        // Scroll to products section
        setTimeout(() => {
          productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      } else {
        // Fallback 1: Try old aesthetic matcher
        console.warn(`⚠️  VibeDNA returned no brands for ${styleId}, trying aesthetic matcher...`);
        const aiQueries = aestheticMatcher.generateSearchQueries(styleId, {
          includeAlternatives: true,
          maxQueries: 10
        });

        if (aiQueries.length > 0) {
          console.log(`🎨 Using AI Aesthetic Matrix queries:`, aiQueries);
          setLastSearchQueries(aiQueries);
          fetchProducts(aiQueries, vintedFilters);
        } else {
          // Fallback 2: Use hashtags
          console.warn(`⚠️  No AI data available, using hashtags:`, hashtags);
          const fallbackQueries = hashtags.slice(0, 3);
          setLastSearchQueries(fallbackQueries);
          fetchProducts(fallbackQueries, vintedFilters);
        }

        setTimeout(() => {
          productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    } catch (error) {
      console.error('VibeDNA search error:', error);
      // Fallback to old behavior on error
      const aiQueries = aestheticMatcher.generateSearchQueries(styleId, {
        includeAlternatives: true,
        maxQueries: 10
      });

      const fallbackQueries = aiQueries.length > 0 ? aiQueries : hashtags.slice(0, 3);
      setLastSearchQueries(fallbackQueries);
      fetchProducts(fallbackQueries, vintedFilters);

      setTimeout(() => {
        productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  return (
    <div className="dig-screen-expanded fixed inset-0 z-50 bg-row-white overflow-auto">
      {/* Header */}
      <div className="border-b-1 border-row-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-row-black hover:text-row-gray-700 transition-colors font-medium"
          >
            ← Back
          </button>
          <h2 className="text-h3 font-sans text-row-black tracking-tight">Dig by Moodboard</h2>
          <div className="w-20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StyleSidebar
          onStyleClick={handleStyleClick}
        />
        <ChatSection
          ref={chatInputRef}
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          handleBrandSuggestion={handleBrandSuggestion}
          handleImageChange={handleImageChange}
          imagePreview={imagePreview}
          removeImage={() => {
            setSelectedImage(null);
            setImagePreview(null);
          }}
          isProcessing={isImageProcessing || isGeneratingImage}
          handleImageGeneration={handleImageGeneration}
          handleUserChoice={handleUserChoice}
        />

        {/* Product Results Section */}
        <div ref={productsRef} className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <VintedFilters
                onFiltersChange={(newFilters) => {
                  setVintedFilters(newFilters);
                  if (lastSearchQueries.length > 0) {
                    fetchProducts(lastSearchQueries, newFilters);
                  }
                }}
              />
            </div>

            {/* Product Results */}
            <div className="lg:col-span-3">
              <div className="p-10 bg-row-white border-2 border-row-black">
                <h2 className="text-h3 font-serif text-row-black mb-6 tracking-tight">Product Results</h2>
                <ProductResults
                  isLoading={isLoadingProducts}
                  error={productSearchError}
                  products={aggregatedProducts}
                  searchInitiated={searchInitiated}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Magic Loader: Show AI thinking process during ranking */}
      <MagicLoader
        isVisible={isLoadingProducts && !!progressMessage}
        progressMessage={progressMessage}
      />
    </div>
  );
};
