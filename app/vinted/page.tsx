'use client';

import { useState, useCallback } from 'react';
import { useChat } from 'ai/react';
import Image from 'next/image';

// Defines the structure for a product from Vinted or Depop
interface Product {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  condition: string;
  link: string;
  platform: 'Vinted' | 'Depop';
  brand?: string;
  size?: string;
}

export default function VintedHomePage() {
  // --- State Management ---
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState<string>('');
  const [ingestionProgress, setIngestionProgress] = useState<number>(0);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [generatedImageSearchQueries, setGeneratedImageSearchQueries] = useState<string[]>([]);

  const [aggregatedProducts, setAggregatedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productSearchError, setProductSearchError] = useState<string | null>(null);
  const [searchInitiated, setSearchInitiated] = useState(false); // NEW: Track if a search has been attempted

  // --- Chat Logic ---
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    api: '/api/vinted/chat',
    onFinish: (message) => {
      console.log('AI Chat Response:', message.content);
      const searchTrigger = "Searching Vinted and Depop for:";
      if (message.content.startsWith(searchTrigger)) {
        const queryPart = message.content.substring(searchTrigger.length).trim();
        const queries = queryPart.split(',').map(q => q.trim()).filter(q => q.length > 0);
        if (queries.length > 0) {
          console.log("AI suggested search queries, triggering product search:", queries);
          fetchProducts(queries);
        }
      }
    },
  });

  // --- Ingestion Handler ---
  const handleIngest = async () => {
    try {
      setIsIngesting(true);
      setIngestionStatus('Starting ingestion...');
      setIngestionProgress(0);

      const response = await fetch('/api/vinted/ingest', { method: 'POST' });
      if (!response.ok) throw new Error(`Failed to start ingestion: ${response.statusText}`);
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        // Handle potential concatenated JSON objects in a single chunk
        const lines = text.split('\n\n').filter(line => line.trim());
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    setIngestionStatus(data.status);
                    if (typeof data.progress === 'number') setIngestionProgress(data.progress);
                } catch (e) { console.error('Error parsing ingestion status:', e); }
            }
        }
      }
      setIngestionStatus('Ingestion completed successfully!');
      setIngestionProgress(100);
    } catch (error) {
      console.error('Error ingesting data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setIngestionStatus(`Error: ${errorMessage}`);
      setIngestionProgress(0);
    } finally {
      setIsIngesting(false);
    }
  };
  
  // --- Product Fetching ---
  const fetchProducts = useCallback(async (queries: string[]) => {
    setIsLoadingProducts(true);
    setSearchInitiated(true); // A search is now officially underway
    setAggregatedProducts([]);
    setProductSearchError(null);

    try {
      const response = await fetch('/api/vinted/search-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch products: ${response.statusText}`);
      }
      const data = await response.json();
      if (Array.isArray(data.products)) {
        setAggregatedProducts(data.products);
      } else {
        console.warn("API returned unexpected data format for products:", data);
        setAggregatedProducts([]); // Ensure it's an empty array
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching products:', error);
      setProductSearchError(`Failed to fetch products: ${errorMessage}`);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // --- Image Search Handlers ---
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setGeneratedImageSearchQueries([]);
      setAggregatedProducts([]);
      setProductSearchError(null);
      setSearchInitiated(false);
    }
  };

  const handleImageSearch = async () => {
    if (!selectedImage) return;

    setIsImageProcessing(true);
    setGeneratedImageSearchQueries([]);
    setAggregatedProducts([]);
    setProductSearchError(null);
    setSearchInitiated(false);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      const response = await fetch('/api/vinted/image-search', { method: 'POST', body: formData });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to process image search: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Image Search Data:", data);

      if (data.generatedSearchQueries && data.generatedSearchQueries.length > 0) {
        setGeneratedImageSearchQueries(data.generatedSearchQueries);
        fetchProducts(data.generatedSearchQueries);
      } else {
        setProductSearchError("Could not generate any search terms from the image. Please try another.");
        setSearchInitiated(true); // Set this to show the "no results" message
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error processing image:', error);
      setProductSearchError(`Error processing image: ${errorMessage}`);
    } finally {
      setIsImageProcessing(false);
    }
  };
  
  // --- Render Functions for Clarity ---
  const renderProductResults = () => {
    if (isLoadingProducts) {
      return (
        <div className="text-center text-gray-600 py-8">
          <div className="flex justify-center items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Searching for items on Vinted and Depop...</span>
          </div>
        </div>
      );
    }

    if (productSearchError) {
      return (
        <div className="text-red-600 bg-red-100 border border-red-200 p-3 rounded-lg">
          Error: {productSearchError}
        </div>
      );
    }
    
    // NEW: Improved logic for displaying no results
    if (searchInitiated && aggregatedProducts.length === 0) {
      return (
        <div className="text-center text-gray-500 italic py-8">
          No products found for your search. Try different keywords or another image!
        </div>
      );
    }

    if (aggregatedProducts.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {aggregatedProducts.map((item) => (
            <div key={item.id} className="border border-gray-200 p-4 rounded-lg shadow-sm flex flex-col h-full bg-white transition-shadow hover:shadow-md">
              <div className="relative w-full h-48 mb-3 rounded-md overflow-hidden">
                <Image
                  src={item.imageUrl || `https://placehold.co/250x250/E2E8F0/1A202C?text=No+Image`}
                  alt={item.title}
                  fill
                  style={{objectFit: "cover"}}
                  className="transition-transform duration-300 hover:scale-105"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2" title={item.title}>{item.title}</h3>
              {item.brand && <p className="text-sm text-gray-500 mb-1">Brand: {item.brand}</p>}
              {item.size && <p className="text-sm text-gray-500 mb-1">Size: {item.size}</p>}
              <p className="text-purple-600 font-bold text-xl mb-1">{item.price}</p>
              <p className="text-xs text-gray-600 mb-2">Condition: {item.condition}</p>
              <p className="text-xs font-bold text-gray-500 mb-3">{item.platform}</p>
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-auto bg-purple-600 text-white px-4 py-2 rounded-lg text-center text-sm hover:bg-purple-700 transition-colors duration-200">
                View on {item.platform}
              </a>
            </div>
          ))}
        </div>
      );
    }
    
    // Default initial state
    return (
        <div className="text-center text-gray-500 italic py-8">
            Product results will appear here. Ask the AI or use image search to begin.
        </div>
    );
  };


  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Vinted / Depop AI Fashion Assistant</h1>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full">
        <div className="px-4 py-6 sm:px-0 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Controls */}
          <div className="flex flex-col space-y-8">
            {/* Ingestion Section */}
            <div className="p-6 bg-white shadow rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Load Data into AI Memory</h2>
              <button onClick={handleIngest} disabled={isIngesting} className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200">
                {isIngesting ? 'Ingesting...' : 'Ingest Vinted Datasets'}
              </button>
              {isIngesting && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${ingestionProgress}%` }}></div></div>
              )}
              {ingestionStatus && <div className="text-sm mt-4"><div className="font-medium text-gray-700">Status:</div><div className="text-gray-600">{ingestionStatus}</div></div>}
            </div>

            {/* Image Search Section */}
            <div className="p-6 bg-white shadow rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Search by Image</h2>
              <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <label htmlFor="image-upload" className="block w-full cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg py-2 px-4 text-center font-semibold mb-4 transition-colors duration-200">
                Upload Image
              </label>
              {imagePreview && <div className="mb-4 text-center"><Image src={imagePreview} alt="Preview" width={200} height={200} style={{objectFit: 'contain'}} className="inline-block rounded-lg border"/></div>}
              <button onClick={handleImageSearch} disabled={!selectedImage || isImageProcessing} className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200">
                {isImageProcessing ? 'Analyzing...' : 'Analyze Image & Search'}
              </button>
            </div>
          </div>

          {/* Right Column: Chat & Results */}
          <div className="flex flex-col space-y-8">
            {/* Chat Section */}
            <div className="bg-white shadow rounded-lg p-6 flex flex-col h-full max-h-[600px] min-h-[400px]">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Search by Style Prompt</h2>
               <div className="flex-1 overflow-y-auto border border-gray-200 p-4 rounded-lg bg-gray-50 flex flex-col-reverse custom-scrollbar">
                    {[...messages].reverse().map((message) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                        <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>{message.content}</div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 italic flex-grow flex items-center justify-center"><p>Ask about styles (e.g., "Futuristic, Coquette"), brands ("Similar to Junya Watanabe"), or items!</p></div>
                    )}
              </div>
              <form onSubmit={handleSubmit} className="mt-4">
                <div className="flex space-x-4">
                  <input value={input} onChange={handleInputChange} placeholder="Describe the style you want..." className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">Send</button>
                </div>
              </form>
            </div>
            
            {/* Product Aggregation Section */}
            <div className="p-6 bg-white shadow rounded-lg flex-grow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Product Results</h2>
              {renderProductResults()}
            </div>
          </div>
        </div>
      </main>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </div>
  );
}