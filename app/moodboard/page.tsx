'use client';

import { useState, FormEvent, ChangeEvent, ReactNode } from 'react';
import { streamComponent } from '../actions';
import { UploadCloud, File as FileIcon, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Page() {
  const [component, setComponent] = useState<ReactNode>();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (selectedFile: File): string | null => {
    // Check file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      return 'Please select a valid CSV file.';
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (selectedFile.size > maxSize) {
      return 'File size must be less than 5MB.';
    }
    
    // Check if file is empty
    if (selectedFile.size === 0) {
      return 'The selected file is empty.';
    }
    
    return null;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setComponent(undefined); // Clear previous results
      setError(null); // Clear previous errors
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setComponent(undefined);
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setComponent(undefined);

    // Use FileReader to read the file content on the client
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const csvContent = event.target?.result as string;
      if (csvContent) {
        try {
          // Show immediate loading feedback
          setComponent(
            <div className="animate-pulse p-8 text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg">Analyzing your CSV data...</span>
              </div>
              <p className="text-gray-400">This may take a few moments</p>
            </div>
          );
          
          // Pass the file's text content to the server action
          const result = await streamComponent(csvContent);
          setComponent(result);
        } catch (err) {
          console.error('Analysis error:', err);
          setError(
            err instanceof Error 
              ? `Analysis failed: ${err.message}` 
              : "Failed to analyze the file. Please check that your CSV is properly formatted."
          );
          setComponent(undefined);
        }
      }
      setIsLoading(false);
    };
    
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };

  const removeFile = () => {
    setFile(null);
    setComponent(undefined);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-900 text-gray-200 justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
            AI CSV Analyzer
          </h1>
          <p className="text-base md:text-lg text-gray-400 mb-4">
            Upload a CSV file to get instant data analysis and insights.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Supports fashion & trend data
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Automatic column detection
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Max 5MB file size
            </span>
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 md:p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="flex flex-col items-start gap-4">
            <div
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-blue-400 bg-blue-900/20'
                  : file
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                <UploadCloud className={`w-8 h-8 mb-2 ${file ? 'text-green-400' : 'text-gray-500'}`} />
                <p className="mb-1 text-sm text-gray-400">
                  <span className="font-semibold">
                    {dragActive ? 'Drop your CSV file here' : 'Click to upload or drag and drop'}
                  </span>
                </p>
                <p className="text-xs text-gray-500">CSV files only (MAX. 5MB)</p>
                {file && (
                  <div className="mt-2 text-xs text-green-400 font-medium">
                    ✓ File ready for analysis
                  </div>
                )}
              </div>
              <input 
                id="csv-upload" 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>

            {file && (
              <div className="flex items-center justify-between w-full p-3 pl-4 rounded-md bg-gray-700 border border-gray-600">
                <div className="flex items-center gap-3">
                  <FileIcon className="w-5 h-5 text-green-400" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-200">{file.name}</span>
                    <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={removeFile} 
                  className="p-1 rounded-full hover:bg-gray-600 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-200" />
                </button>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={isLoading || !file}
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
              )}
              {isLoading ? 'Analyzing CSV Data...' : 'Analyze CSV File'}
            </button>
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-md bg-red-900/30 border border-red-700">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-300">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}
          
          <div className="mt-6 w-full">
            {component && (
              <div className="bg-white rounded-lg overflow-hidden">
                {component}
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <details className="text-left max-w-2xl mx-auto">
            <summary className="cursor-pointer text-gray-400 hover:text-gray-300 transition-colors font-medium mb-2">
              💡 Tips for best results
            </summary>
            <div className="text-sm text-gray-500 space-y-2 mt-3 p-4 bg-gray-800 rounded-lg">
              <p>• <strong>Column Headers:</strong> Include clear headers like "title", "engagement", "platform", "category", etc.</p>
              <p>• <strong>Fashion Content:</strong> The analyzer will automatically detect fashion and trend-related content</p>
              <p>• <strong>Engagement Data:</strong> Include numeric columns with engagement metrics (likes, views, shares)</p>
              <p>• <strong>File Format:</strong> Standard CSV format with comma separators works best</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}