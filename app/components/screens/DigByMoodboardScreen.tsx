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
    fetchProducts,
  } = useProductFetcher();

  // Vinted Filter State
  const [vintedFilters, setVintedFilters] = useState<VintedFilterState>({
    order: 'newest_first',
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

  // Direct search handler for style cards
  const handleStyleClick = (styleName: string, hashtags: string[]) => {
    console.log(`Direct search for style: ${styleName}`);

    // Use AI Aesthetic Matrix to generate smart queries
    const aiQueries = aestheticMatcher.generateSearchQueries(styleName, {
      includeAlternatives: true,
      maxQueries: 10
    });

    let queries: string[];

    if (aiQueries.length > 0) {
      console.log(`🎨 Using AI Aesthetic Matrix queries for ${styleName}:`, aiQueries);
      // Mix AI-generated brand queries with aesthetic keywords
      queries = aiQueries;
    } else {
      // Fallback to hashtags if no AI data available
      console.log(`⚠️  No AI data for ${styleName}, using hashtags:`, hashtags);
      queries = hashtags.slice(0, 3);
    }

    // Immediately trigger product search
    setLastSearchQueries(queries);
    fetchProducts(queries, vintedFilters);

    // Scroll to products section after a short delay
    setTimeout(() => {
      productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
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
    </div>
  );
};
