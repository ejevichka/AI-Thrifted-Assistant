'use client';

import { Message } from 'ai/react';
import { FormEvent } from 'react';
import Image from 'next/image';
// --- ✨ ICON CHANGE ✨ ---
// Replaced heroicons with lucide-react for a cleaner, more customizable style
import { Paperclip, XCircle, ArrowUpCircle } from 'lucide-react';

interface ChatSectionProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  handleBrandSuggestion: (e: FormEvent) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  removeImage: () => void;
  isProcessing: boolean;
}

export default function ChatSection({ 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit, 
  handleBrandSuggestion,
  handleImageChange,
  imagePreview,
  removeImage,
  isProcessing
}: ChatSectionProps) {
  return (
    <div className="bg-[#23232b] shadow rounded-lg p-6 flex flex-col h-full max-h-[700px] min-h-[500px]">
      <h2 className="text-xl font-semibold text-white mb-4">AI Fashion Assistant</h2>
      
      {/* Message Display Area (Unchanged) */}
      <div className="flex-1 overflow-y-auto border border-gray-700 p-4 rounded-t-lg bg-gray-900 flex flex-col-reverse custom-scrollbar">
        {[...messages].reverse().map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${message.role === 'user' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
              {message.content}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
            <div className="text-center text-gray-400 italic flex-grow flex items-center justify-center">
              <p>Describe a style, an item, or upload an image to start your search.</p>
            </div>
        )}
      </div>
    
      {/* Unified Input Form */}
      <form onSubmit={handleSubmit} className="border border-t-0 border-gray-700 rounded-b-lg p-3 bg-[#23232b] flex flex-col gap-3">
        {/* Image Preview Area */}
        {imagePreview && (
          <div className="relative w-28 h-28 group"> {/* Increased preview size */}
            <Image src={imagePreview} alt="Selected preview" layout="fill" objectFit="cover" className="rounded-md border-2 border-gray-600" />
            <button 
              type="button" 
              onClick={removeImage} 
              className="absolute -top-2 -right-2 bg-gray-800 rounded-full text-white transform transition-transform group-hover:scale-110"
              aria-label="Remove image"
            >
              {/* --- ✨ ICON CHANGE ✨ --- */}
              <XCircle className="w-8 h-8" />
            </button>
          </div>
        )}

        {/* Text Input and Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Hidden file input */}
          <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          
          {/* Image Upload Button */}
          <label htmlFor="image-upload" className="p-2 text-gray-400 hover:text-icu-2 cursor-pointer transition-all duration-200 hover:scale-110">
            {/* --- ✨ ICON CHANGE ✨ --- */}
            <Paperclip className="w-7 h-7" strokeWidth={2} />
          </label>

          {/* Text Input */}
          <textarea 
            value={input} 
            onChange={handleInputChange} 
            placeholder={imagePreview ? "Add a comment... (optional)" : "Describe the style you want..."}
            className="flex-1 rounded-lg border border-gray-600 bg-gray-800 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-icu-2 placeholder-gray-400" // Increased py
          />
          
          {/* Primary Submit Button */}
          <button 
            type="submit"  
            disabled={isProcessing || (!input.trim() && !imagePreview)}
            className="p-1 text-white bg-icu-2 rounded-full hover:bg-icu-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            aria-label="Find Items or Analyze Image"
          >
            {isProcessing ? 
              <div className="w-9 h-9 border-4 border-white border-t-transparent rounded-full animate-spin"></div> 
              : 
              // --- ✨ ICON CHANGE ✨ ---
              <ArrowUpCircle className="w-10 h-10" strokeWidth={1.5} />
            }
          </button>
        </div>
         {/* Secondary Action Button */}
         <div className="flex justify-end pr-14">
            <button 
                type="button"
                onClick={handleBrandSuggestion}
                disabled={!input.trim() || isProcessing}
                className="text-gray-400 hover:text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Suggest Brands"
                title="Suggest Brands"
            >
                Or, suggest brands for this text
            </button>
         </div>
      </form>
    </div>
  );
}