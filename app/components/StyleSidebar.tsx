/* eslint-disable @next/next/no-img-element */
'use client';

import styleVibes from "@/data/vinted/styles.json";
import { FormEvent, useRef } from "react";
import { Message, useChat } from "ai/react";

interface StyleSidebarProps {
    setMessages: (messages: Message[]) => void;
    handleSubmit: (e: FormEvent<HTMLFormElement>, options?: {
        options?: {
            body?: Record<string, any>;
        } | undefined;
    } | undefined) => void;
    setInput: (input: string) => void;
}

export default function StyleSidebar({ setMessages, handleSubmit, setInput }: StyleSidebarProps) {
    const formRef = useRef<HTMLFormElement>(null);

    const handleStyleClick = (styleName: string, hashtags: string[]) => {
      const prompt = `Moodboard items with a ${styleName} aesthetic. List brands with this vibe: ${hashtags.join(', ')}.`;
      setInput(prompt);
      
    };

    return (
      <div className="h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
        <div className="pinterest-grid">
          {styleVibes.styles.map((style) => (
            <div
              key={style.id}
              className="pinterest-item group"
              onClick={() => handleStyleClick(style.name, style.hashtags)}
            >
              
              <img
                src={`/images/styles/${style.id}.jpg`}
                alt={style.name}
                onError={e => { e.currentTarget.src = 'https://placehold.co/400x300/E2E8F0/1A202C?text=No+Image'; }}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent">
                <h3 className="font-semibold text-white mb-2">{style.name}</h3>
                <p className="text-sm text-gray-200 mb-3 line-clamp-2">{style.description}</p>
                <div className="flex flex-wrap gap-2">
                  {style.hashtags.slice(0, 4).map((tag) => (
                    <span key={tag} className="bg-white/30 text-white text-xs px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
} 