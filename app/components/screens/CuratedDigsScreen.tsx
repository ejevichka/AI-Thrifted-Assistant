'use client';

import React from 'react';

interface CuratedDigsScreenProps {
  onBack: () => void;
  gradient: string;
  accentColor: string;
}

export const CuratedDigsScreen: React.FC<CuratedDigsScreenProps> = ({
  onBack,
}) => {
  return (
    <div className="dig-screen-expanded fixed inset-0 z-50 bg-row-white">
      {/* Header */}
      <div className="border-b-1 border-row-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-row-black hover:text-row-gray-700 transition-colors font-medium"
          >
            ← Back
          </button>
          <h2 className="text-h3 font-sans text-row-black tracking-tight">Curated Pieces</h2>
          <div className="w-20" />
        </div>
      </div>

      {/* Empty content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-row-gray-600 text-body">Coming soon...</p>
        </div>
      </div>
    </div>
  );
};
