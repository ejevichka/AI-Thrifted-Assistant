'use client';

interface IngestionSectionProps {
  // handleIngest is no longer needed as a prop since it's triggered automatically
  isIngesting: boolean;
  ingestionProgress: number;
  ingestionStatus: string;
}

export default function IngestionSection({ isIngesting, ingestionProgress, ingestionStatus }: IngestionSectionProps) {
  // This component now only displays the status of an in-progress ingestion.
  // It returns null if ingestion is not active, but we control rendering from the parent.
  if (!isIngesting) {
    return null;
  }

  return (
    <div className="p-6 bg-[#23232b] shadow rounded-lg transition-opacity duration-500">
      <h2 className="text-xl font-semibold text-white mb-4">First-time Setup: Loading AI Memory</h2>
      <p className="text-sm text-gray-400 mb-4">This one-time process populates the AIs knowledge base. Please wait a moment...</p>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-icu-1 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${ingestionProgress}%` }}
        ></div>
      </div>
      
      {/* Status Text */}
      <div className="text-sm mt-3 text-center">
        <div className="font-medium text-gray-300">{ingestionStatus}</div>
      </div>
    </div>
  );
}