'use client';

import { Message } from 'ai/react';
import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { Paperclip, XCircle, ArrowUpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown

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
  handleImageGeneration: (prompt: string) => Promise<void>; // New prop
  handleUserChoice: (choice: 'yes' | 'no') => void; // New prop
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
  isProcessing,
  handleImageGeneration,
  handleUserChoice
}: ChatSectionProps) {

  const latestMessage = messages[messages.length - 1];
  const showImageGenButtons = latestMessage?.role === 'assistant' && latestMessage.content.includes('Would you like me to create an image');

  return (
    <div className="bg-[#23232b] shadow rounded-lg p-6 flex flex-col h-full max-h-[700px] min-h-[500px]">
      <h2 className="text-xl font-semibold text-white mb-4">AI Fashion Assistant</h2>
      
      <div className="flex-1 overflow-y-auto border border-gray-700 p-4 rounded-t-lg bg-gray-900 flex flex-col-reverse custom-scrollbar">
        {[...messages].reverse().map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${message.role === 'user' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
              <ReactMarkdown>{message.content}</ReactMarkdown> 
            </div>
          </div>
        ))}
        {messages.length === 0 && (
            <div className="text-center text-gray-400 italic flex-grow flex items-center justify-center">
              <p>Describe a style, an item, or upload an image to start your search.</p>
            </div>
        )}
      </div>

      {showImageGenButtons ? (
        <div className="flex justify-center p-4 bg-[#23232b] border-t-0 border-gray-700 rounded-b-lg">
          <button onClick={() => handleUserChoice('yes')} className="bg-green-500 text-white px-6 py-2 rounded-lg mr-4 hover:bg-green-600">Yes, please!</button>
          <button onClick={() => handleUserChoice('no')} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">No, thanks</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border border-t-0 border-gray-700 rounded-b-lg p-3 bg-[#23232b] flex flex-col gap-3">
          {imagePreview && (
            <div className="relative w-28 h-28 group">
              <Image src={imagePreview} alt="Selected preview" layout="fill" objectFit="cover" className="rounded-md border-2 border-gray-600" />
              <button 
                type="button" 
                onClick={removeImage} 
                className="absolute -top-2 -right-2 bg-gray-800 rounded-full text-white transform transition-transform group-hover:scale-110"
                aria-label="Remove image"
              >
                <XCircle className="w-8 h-8" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <label htmlFor="image-upload" className="p-2 text-gray-400 hover:text-icu-2 cursor-pointer transition-all duration-200 hover:scale-110">
              <Paperclip className="w-7 h-7" strokeWidth={2} />
            </label>
            <textarea 
              value={input} 
              onChange={handleInputChange} 
              placeholder={imagePreview ? "Add a comment... (optional)" : "Describe the style you want..."}
              className="flex-1 rounded-lg border border-gray-600 bg-gray-800 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-icu-2 placeholder-gray-400"
            />
            <button 
              type="submit"  
              disabled={isProcessing || (!input.trim() && !imagePreview)}
              className="p-1 text-white bg-icu-2 rounded-full hover:bg-icu-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              aria-label="Find Items or Analyze Image"
            >
              {isProcessing ? 
                <div className="w-9 h-9 border-4 border-white border-t-transparent rounded-full animate-spin"></div> 
                : 
                <ArrowUpCircle className="w-10 h-10" strokeWidth={1.5} />
              }
            </button>
          </div>
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
      )}
    </div>
  );
}