'use client';

import { useEffect, useState } from 'react';

interface MagicLoaderProps {
  isVisible: boolean;
  styleName?: string;
  progressMessage?: string | null;
  onComplete?: () => void;
}

/**
 * Magic Loader: Shows AI thinking process during AI-Ranker execution
 *
 * Instead of a boring spinner, this shows the user what's happening:
 * - VibeDNA brand selection
 * - Vinted candidate collection
 * - AI-Ranker chunking progress
 * - Gem discovery
 */
export default function MagicLoader({
  isVisible,
  styleName = 'Gorpcore',
  progressMessage,
  onComplete
}: MagicLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState('Загрузка...');
  const [messageHistory, setMessageHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessage('Загрузка...');
      setMessageHistory([]);
      return;
    }

    // Update current message when progressMessage changes
    if (progressMessage) {
      setCurrentMessage(progressMessage);
      setMessageHistory(prev => [...prev, progressMessage].slice(-5)); // Keep last 5 messages
    }
  }, [isVisible, progressMessage]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-row-black bg-opacity-90 backdrop-blur-sm">
      <div className="max-w-2xl px-8 py-12 text-center">
        {/* Animated dots */}
        <div className="mb-8 flex justify-center space-x-2">
          <div className="h-3 w-3 animate-bounce rounded-full bg-row-white" style={{ animationDelay: '0ms' }}></div>
          <div className="h-3 w-3 animate-bounce rounded-full bg-row-white" style={{ animationDelay: '150ms' }}></div>
          <div className="h-3 w-3 animate-bounce rounded-full bg-row-white" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Current message */}
        <p className="text-h3 font-mono text-row-white animate-fade-in">
          {currentMessage}
        </p>

        {/* Subtext */}
        <p className="mt-6 text-body text-row-white opacity-60">
          AI curates your vibe...
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
