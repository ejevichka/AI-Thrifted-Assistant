'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useChat, Message } from 'ai/react';
import IngestionSection from './components/IngestionSection';
import ImageSearchSection from './components/ImageSearchSection';
import StyleSidebar from './components/StyleSidebar';
import ChatSection from './components/ChatSection';
import ProductResults from './components/ProductResults';
import './styles/pinterest.css';
import { toast } from "sonner";
import { useProductFetcher } from './components/hooks/useProductFetcher';

export default function VintedHomePage() {
  // --- Product Fetcher Hook ---
  const {
    products: aggregatedProducts,
    isLoading: isLoadingProducts,
    error: productSearchError,
    searchInitiated,
    fetchProducts,
    clearProducts,
  } = useProductFetcher();

  // --- Other State Management ---
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState<string>('');
  const [ingestionProgress, setIngestionProgress] = useState<number>(0);
  const [ingestionNeeded, setIngestionNeeded] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [generatedImageSearchQueries, setGeneratedImageSearchQueries] = useState<string[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false); // New state

  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({});

  const { messages, input, handleInputChange, handleSubmit, setMessages, setInput, append } = useChat({
    api: '/api/vinted/chat',
    onResponse(response) {
      const sourcesHeader = response.headers.get("x-sources");
      const sources = sourcesHeader
        ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8"))
        : [];

      const messageIndexHeader = response.headers.get("x-message-index");
      if (sources.length && messageIndexHeader !== null) {
        setSourcesForMessages({
          ...sourcesForMessages,
          [messageIndexHeader]: sources,
        });
      }
    },
    streamMode: "text",
    onError: (e) =>
      toast.error(`Error while processing your request`, {
        description: e.message,
      }),
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

  // --- Image Generation Handler ---
  const handleImageGeneration = async (prompt: string) => {
    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/vinted/image-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const { imageUrl } = await response.json();
      const imageMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Heres the image I generated for you:\n![Generated Outfit](${imageUrl})`,
      };
      setMessages([...messages, imageMessage]);

      // Follow-up message to ask if the user wants to search for these items
      const followUpMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Would you like me to find items similar to this image?'
      };
      setMessages(currentMessages => [...currentMessages, followUpMessage]);


    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error('Image Generation Failed', { description: errorMessage });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // --- User Choice Handler for Image Gen ---
  const handleUserChoice = async (choice: 'yes' | 'no') => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;

    if (choice === 'yes') {
      // Add user's "Yes" to chat
      append({ role: 'user', content: 'Yes, please generate the image.' });
      // Extract the outfit description from the assistant's question
      const outfitDescription = lastMessage.content
        .replace("I'm thinking of a ", "")
        .replace("Would you like me to create an image of that for you?", "")
        .trim();
      
      await handleImageGeneration(outfitDescription);

    } else { // 'no'
      // Add user's "No" to chat and ask the assistant to proceed with the search
      append({
        role: 'user',
        content: 'No, thanks. Just find the items for me.'
      });
    }
  };


   // --- AUTOMATED INGESTION LOGIC ---

  // 1. Check ingestion status when the component first mounts
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/vinted/ingest-status');
        const data = await response.json();
        if (!data.isIngested) {
          // If data is not ingested, set the flag to trigger the process
          setIngestionNeeded(true);
        }
      } catch (error) {
        console.error("Failed to check ingestion status:", error);
        // Optionally handle the error in the UI
      }
    };
    checkStatus();
  }, []); // The empty dependency array [] ensures this runs only once on mount

    
  // 3. Trigger the ingestion process if it's needed
  useEffect(() => {
    if (ingestionNeeded && !isIngesting) {
      handleIngest();
    }
  }, [ingestionNeeded, isIngesting]); // This effect runs when `ingestionNeeded` changes


  // --- Brand Suggestion Handler (FIXED) ---
  const handleBrandSuggestion = (e: FormEvent) => {
    e.preventDefault();
    // 1. Save the current input value before the hook clears it.
    const currentInput = input;
    if (!currentInput.trim()) return;

    // 2. Create the special prompt for the LLM
    const brandPrompt = `
      You are a fashion expert and personal shopper. 
      Based on the following user input describing a style vibe: "${currentInput}", 
      suggest 3 to 5 specific brands that are commonly found on second-hand marketplaces like Vinted or Depop that match this style.
      For each brand, provide a very brief, one-sentence explanation of why it fits the vibe.
      Do not generate search queries. Only provide brand recommendations.
      Format your response clearly.
    `;

    // 3. Add a user-facing message to the chat history for good UX
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `Suggest brands for: ${currentInput}`,
      role: 'user',
    };
    setMessages([...messages, userMessage]);

  // Add the @ts-ignore comment on the line immediately before the error
// @ts-ignore
    handleSubmit(e, {
      options: {
        body: {
          messages: [...messages, { ...userMessage, content: brandPrompt }],
        },
      },
    });

    // 5. ✨ THE FIX: Restore the input field value.
    // We use a short timeout to ensure this happens after the `useChat` hook's internal state update.
    setTimeout(() => {
        setInput(currentInput);
    }, 0);
  };


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

  // --- Image Search Handlers ---
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
        await fetchProducts(data.generatedSearchQueries);
      } else {
        throw new Error("Could not generate any search terms from the image. Please try another.");
      }
    } catch (error) {
       // Error handling is now managed by the useProductFetcher hook
    } finally {
      setIsImageProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#18181b] text-gray-100 font-sans">
      <header className="bg-[#23232b] shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-ashborn text-white">Vinted / Depop AI Fashion Assistant</h1>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full">
         <StyleSidebar setMessages={setMessages} handleSubmit={handleSubmit} setInput={setInput} />
         <ChatSection 
              messages={messages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              handleBrandSuggestion={handleBrandSuggestion}
              handleImageChange={handleImageChange}
              imagePreview={imagePreview}
              removeImage={() => setSelectedImage(null)}
              isProcessing={isImageProcessing || isGeneratingImage} // Updated prop
              handleImageGeneration={handleImageGeneration} // New prop
              handleUserChoice={handleUserChoice} // New prop
            />
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-8">
             {ingestionNeeded && (
              <IngestionSection 
                isIngesting={isIngesting}
                ingestionProgress={ingestionProgress}
                ingestionStatus={ingestionStatus}
              />
            )}
          </div>
          <div className="space-y-8">
          <ImageSearchSection 
              handleImageChange={handleImageChange}
              handleImageSearch={handleImageSearch}
              selectedImage={selectedImage}
              isImageProcessing={isImageProcessing}
              imagePreview={imagePreview}
              generatedImageSearchQueries={generatedImageSearchQueries}
            />
            <div className="p-6 bg-[#23232b] shadow rounded-lg flex-grow">
              <h2 className="text-xl font-semibold text-white mb-4">Product Results</h2>
              <ProductResults 
                isLoading={isLoadingProducts}
                error={productSearchError}
                products={aggregatedProducts}
                searchInitiated={searchInitiated}
              />
            </div>
          </div>
        </div>
      </main>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #23232b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #666; }
      `}</style>
    </div>
  );
}