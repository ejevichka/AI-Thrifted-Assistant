'use client';

import Image from 'next/image';

interface ImageSearchSectionProps {
  handleImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageSearch: () => void;
  selectedImage: File | null;
  isImageProcessing: boolean;
  imagePreview: string | null;
  generatedImageSearchQueries: string[];
}

export default function ImageSearchSection({ handleImageChange, handleImageSearch, selectedImage, isImageProcessing, imagePreview, generatedImageSearchQueries }: ImageSearchSectionProps) {
  return (
    <div className="p-6 bg-[#23232b] shadow rounded-lg">
      <h2 className="text-xl font-semibold text-white mb-4">2. Search by Image</h2>
      <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
      <label htmlFor="image-upload" className="block w-full cursor-pointer bg-icu-2 text-blue-200 hover:bg-icu-1 rounded-lg py-2 px-4 text-center font-semibold mb-4 transition-colors duration-200">
        Upload Image
      </label>
      {imagePreview && <div className="mb-4 text-center"><Image src={imagePreview} alt="Preview" width={200} height={200} style={{objectFit: 'contain'}} className="inline-block rounded-lg border"/></div>}
      {generatedImageSearchQueries.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-300 mb-2">AI Generated Search Queries:</p>
          <div className="flex flex-wrap gap-2">
            {generatedImageSearchQueries.map((query, index) => (
              <span key={index} className="bg-gray-700 text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full">
                {query}
              </span>
            ))}
          </div>
        </div>
      )}
      <button onClick={handleImageSearch} disabled={!selectedImage || isImageProcessing} className="w-full bg-accent1 text-white px-4 py-2 rounded-lg hover:bg-accent1 focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors duration-200">
        {isImageProcessing ? 'Analyzing...' : 'Analyze Image & Search'}
      </button>
    </div>
  );
} 