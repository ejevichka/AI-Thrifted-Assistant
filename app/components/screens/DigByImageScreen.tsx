'use client';

import React, { useState, useRef, FormEvent } from 'react';
import { useChat, Message } from 'ai/react';
import ImageSearchSection from '../ImageSearchSection';
import ChatSection from '../ChatSection';
import ProductResults from '../ProductResults';
import ProductFilters, { FilterState } from '../ProductFilters';
import { useProductFetcher } from '../hooks/useProductFetcher';
import { toast } from 'sonner';

interface DigByImageScreenProps {
  onBack: () => void;
  gradient: string;
  accentColor: string;
}

export const DigByImageScreen: React.FC<DigByImageScreenProps> = ({
  onBack,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageSearchQueries, setGeneratedImageSearchQueries] = useState<string[]>([]);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Product Fetcher Hook
  const {
    products: aggregatedProducts,
    isLoading: isLoadingProducts,
    error: productSearchError,
    searchInitiated,
    fetchProducts,
    clearProducts,
  } = useProductFetcher();

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    priceRange: { min: null, max: null },
    sizes: []
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
          fetchProducts(queries, filters);
        }
      }
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setGeneratedImageSearchQueries([]);
      clearProducts();
    }
  };

  const handleImageSearch = async () => {
    if (!selectedImage) return;

    setIsImageProcessing(true);
    setGeneratedImageSearchQueries([]);
    clearProducts();

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      const response = await fetch('/api/vinted/image-search', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to process image search: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Image Search Response:", data);

      if (data.generatedSearchQueries && data.generatedSearchQueries.length > 0) {
        setGeneratedImageSearchQueries(data.generatedSearchQueries);
        setLastSearchQueries(data.generatedSearchQueries);
        await fetchProducts(data.generatedSearchQueries, filters);
      } else {
        throw new Error("Could not generate any search terms from the image. Please try another.");
      }
    } catch (error) {
      // Error handling is managed by the useProductFetcher hook
      console.error('Image search error:', error);
    } finally {
      setIsImageProcessing(false);
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
          <h2 className="text-h3 font-sans text-row-black tracking-tight">Dig by Image</h2>
          <div className="w-20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <ImageSearchSection
            handleImageChange={handleImageChange}
            handleImageSearch={handleImageSearch}
            selectedImage={selectedImage}
            isImageProcessing={isImageProcessing}
            imagePreview={imagePreview}
            generatedImageSearchQueries={generatedImageSearchQueries}
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
          <div className="px-4 py-6 sm:px-0">
            <div className="p-10 bg-row-white border-1 border-row-black flex-grow">
              <h2 className="text-h3 font-serif text-row-black mb-6 tracking-tight">Product Results</h2>
              {searchInitiated && (
                <ProductFilters
                  onFiltersChange={(newFilters) => {
                    setFilters(newFilters);
                    if (lastSearchQueries.length > 0) {
                      fetchProducts(lastSearchQueries, newFilters);
                    }
                  }}
                />
              )}
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
  );
};
