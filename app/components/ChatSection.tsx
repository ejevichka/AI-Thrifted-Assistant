import { Message } from 'ai/react';
import { FormEvent, useState, forwardRef } from 'react';
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

const ChatSection = forwardRef<HTMLTextAreaElement, ChatSectionProps>(({ 
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
}, ref) => {

  const latestMessage = messages[messages.length - 1];
  const showImageGenButtons = latestMessage?.role === 'assistant' && latestMessage.content.includes('Would you like me to create an image');

  return (
    <div className="bg-row-white border-1 border-row-black p-8 flex flex-col h-full max-h-[700px] min-h-[500px]">
      <h2 className="text-h3 font-serif text-row-black mb-6 tracking-tight">AI Fashion Assistant</h2>

      <div className="flex-1 overflow-y-auto border-1 border-row-black p-6 bg-row-white flex flex-col-reverse custom-scrollbar">
        {[...messages].reverse().map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`px-5 py-3 max-w-[80%] break-words font-sans text-body ${message.role === 'user' ? 'bg-row-black text-row-white' : 'bg-row-white border-1 border-row-black text-row-black'}`}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
            <div className="text-center text-row-gray-400 flex-grow flex items-center justify-center">
              <p className="font-sans text-body">Describe a style, an item, or upload an image to start your search.</p>
            </div>
        )}
      </div>

      {showImageGenButtons ? (
        <div className="flex justify-center p-6 bg-row-white border-t-2 border-row-black">
          <button onClick={() => handleUserChoice('yes')} className="bg-row-black text-row-white px-8 py-3 mr-4 hover:bg-row-gray-800 uppercase tracking-wider text-caption font-medium transition-all duration-400">Yes, please!</button>
          <button onClick={() => handleUserChoice('no')} className="bg-row-white border-1 border-row-black text-row-black px-8 py-3 hover:bg-row-black hover:text-row-white uppercase tracking-wider text-caption font-medium transition-all duration-400">No, thanks</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border-1 border-t-0 border-row-black p-4 bg-row-white flex flex-col gap-3">
          {imagePreview && (
            <div className="relative w-32 h-32 group">
              <Image src={imagePreview} alt="Selected preview" layout="fill" objectFit="cover" className="border-1 border-row-black" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-row-black text-row-white transform transition-transform group-hover:scale-110"
                aria-label="Remove image"
              >
                <XCircle className="w-7 h-7" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <label htmlFor="image-upload" className="p-2 text-row-black hover:opacity-70 cursor-pointer transition-all duration-400">
              <Paperclip className="w-6 h-6" strokeWidth={2} />
            </label>
            <textarea
              ref={ref}
              value={input}
              onChange={handleInputChange}
              placeholder={imagePreview ? "Add a comment... (optional)" : "Describe the style you want..."}
              className="flex-1 border-row-black bg-transparent text-row-black px-0 py-3 font-sans text-body focus:outline-none placeholder-row-gray-400 resize-none transition-all duration-400"
              rows={1}
            />
            <button
              type="submit"
              disabled={isProcessing || (!input.trim() && !imagePreview)}
              className="p-2 text-row-white bg-row-black hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400"
              aria-label="Find Items or Analyze Image"
            >
              {isProcessing ?
                <div className="w-6 h-6 border-1 border-row-white border-t-transparent rounded-full animate-spin"></div>
                :
                <ArrowUpCircle className="w-6 h-6" strokeWidth={2} />
              }
            </button>
          </div>
           <div className="flex justify-end">
              <button
                  type="button"
                  onClick={handleBrandSuggestion}
                  disabled={!input.trim() || isProcessing}
                  className="text-row-black hover:opacity-70 text-caption font-medium uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400"
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
});

ChatSection.displayName = 'ChatSection';

export default ChatSection;