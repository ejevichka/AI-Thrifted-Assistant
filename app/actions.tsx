'use server';

import { streamUI } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';
import Papa from 'papaparse';

const LoadingComponent = () => (
  <div className="animate-pulse p-4">
    <div className="flex items-center space-x-2">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span>Analyzing fashion trends from dataset...</span>
    </div>
  </div>
);

interface FashionTrend {
  trend: string;
  platform: string;
  engagement: string;
  category?: string;
  hashtags?: string;
}

interface FashionAnalysisResult {
  trends: FashionTrend[];
  totalRecords: number;
  fashionRecords: number;
  topPlatforms: Array<{ platform: string; count: number; percentage: string }>;
  topHashtags: Array<{ hashtag: string; count: number }>;
  engagementStats: {
    average: number;
    highest: number;
    lowest: number;
  };
}

const analyzeFashionDataset = async (datasetPath: string): Promise<FashionAnalysisResult> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    // Read CSV file from the public directory or data directory
    const csvPath = join(process.cwd(), 'public', 'data', datasetPath);
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const parseResult = Papa.parse(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    
    const rawData = parseResult.data as any[];
    
    // Fashion-related keywords for filtering
    const fashionKeywords = [
      'fashion', 'style', 'outfit', 'clothing', 'dress', 'shirt', 'pants', 
      'shoes', 'accessories', 'jewelry', 'handbag', 'makeup', 'beauty',
      'skincare', 'hair', 'nails', 'aesthetic', 'ootd', 'lookbook',
      'thrift', 'vintage', 'designer', 'brand', 'trendy', 'chic',
      'minimalist', 'maximalist', 'streetwear', 'formal', 'casual',
      'cottagecore', 'y2k', 'grunge', 'preppy', 'bohemian', 'gothic',
      'sustainable', 'ethical', 'slow fashion', 'fast fashion'
    ];
    
    // Filter fashion-related data
    const fashionData = rawData.filter(row => {
      const rowText = Object.values(row).join(' ').toLowerCase();
      return fashionKeywords.some(keyword => rowText.includes(keyword));
    });
    
    // Find relevant columns dynamically
    const sampleRow = rawData[0] || {};
    const columns = Object.keys(sampleRow);
    
    const trendCol = columns.find(col => 
      ['trend', 'title', 'content', 'description', 'name', 'topic'].some(keyword => 
        col.toLowerCase().includes(keyword)
      )
    );
    
    const platformCol = columns.find(col => 
      col.toLowerCase().includes('platform')
    );
    
    const engagementCol = columns.find(col => 
      ['engagement', 'rate', 'score', 'likes', 'views', 'shares'].some(keyword => 
        col.toLowerCase().includes(keyword)
      )
    );
    
    const categoryCol = columns.find(col => 
      col.toLowerCase().includes('category')
    );
    
    const hashtagCol = columns.find(col => 
      ['hashtag', 'tag', 'tags'].some(keyword => 
        col.toLowerCase().includes(keyword)
      )
    );
    
    // Extract top fashion trends
    const trends: FashionTrend[] = fashionData
      .filter(row => engagementCol ? !isNaN(parseFloat(row[engagementCol])) : true)
      .sort((a, b) => {
        if (engagementCol) {
          return parseFloat(b[engagementCol]) - parseFloat(a[engagementCol]);
        }
        return 0;
      })
      .slice(0, 10)
      .map(row => ({
        trend: trendCol ? String(row[trendCol]).substring(0, 60) + (String(row[trendCol]).length > 60 ? '...' : '') : 'N/A',
        platform: platformCol ? row[platformCol] : 'N/A',
        engagement: engagementCol ? parseFloat(row[engagementCol]).toFixed(1) : 'N/A',
        category: categoryCol ? row[categoryCol] : undefined,
        hashtags: hashtagCol ? row[hashtagCol] : undefined,
      }));
    
    // Calculate platform distribution
    const platformCounts: Record<string, number> = {};
    fashionData.forEach(row => {
      const platform = platformCol ? row[platformCol] : 'Unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });
    
    const topPlatforms = Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([platform, count]) => ({
        platform,
        count,
        percentage: `${((count / fashionData.length) * 100).toFixed(1)}%`
      }));
    
    // Extract top hashtags
    const hashtagCounts: Record<string, number> = {};
    if (hashtagCol) {
      fashionData.forEach(row => {
        const hashtags = row[hashtagCol];
        if (hashtags && typeof hashtags === 'string') {
          const tags = hashtags.replace(/#/g, '').split(/[,\s]+/);
          tags.forEach(tag => {
            const cleanTag = tag.trim().toLowerCase();
            if (cleanTag && fashionKeywords.some(keyword => cleanTag.includes(keyword))) {
              hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
            }
          });
        }
      });
    }
    
    const topHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([hashtag, count]) => ({
        hashtag: `#${hashtag}`,
        count
      }));
    
    // Calculate engagement statistics
    const engagementValues = engagementCol ? 
      fashionData
        .map(row => parseFloat(row[engagementCol]))
        .filter(val => !isNaN(val))
      : [];
    
    const engagementStats = {
      average: engagementValues.length > 0 ? 
        engagementValues.reduce((a, b) => a + b, 0) / engagementValues.length : 0,
      highest: engagementValues.length > 0 ? Math.max(...engagementValues) : 0,
      lowest: engagementValues.length > 0 ? Math.min(...engagementValues) : 0,
    };
    
    return {
      trends,
      totalRecords: rawData.length,
      fashionRecords: fashionData.length,
      topPlatforms,
      topHashtags,
      engagementStats
    };
    
  } catch (error) {
    console.error('Error analyzing fashion dataset:', error);
    throw new Error('Failed to analyze fashion dataset');
  }
};

interface FashionTableProps {
  data: FashionAnalysisResult;
}

const FashionTableComponent = ({ data }: FashionTableProps) => (
  <div className="max-w-6xl mx-auto p-6 space-y-8">
    {/* Header */}
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Fashion Trends Analysis</h2>
      <p className="text-gray-600">
        Analyzed {data.fashionRecords} fashion trends from {data.totalRecords} total records
      </p>
    </div>

    {/* Summary Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-blue-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-blue-600">{data.fashionRecords}</div>
        <div className="text-sm text-gray-600">Fashion Trends</div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-green-600">{data.engagementStats.average.toFixed(1)}</div>
        <div className="text-sm text-gray-600">Avg Engagement</div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-purple-600">{data.topPlatforms.length}</div>
        <div className="text-sm text-gray-600">Active Platforms</div>
      </div>
    </div>

    {/* Top Fashion Trends Table */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">🔥 Top Fashion Trends</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagement
              </th>
              {data.trends[0]?.category && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.trends.map((trend, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{trend.trend}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {trend.platform}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{trend.engagement}</td>
                {trend.category && (
                  <td className="px-6 py-4 text-sm text-gray-900">{trend.category}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Platform Distribution */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">📱 Platform Distribution</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.topPlatforms.map((platform, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{platform.platform}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{platform.count}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: platform.percentage }}
                      ></div>
                    </div>
                    {platform.percentage}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Top Hashtags */}
    {data.topHashtags.length > 0 && (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">🏷️ Top Fashion Hashtags</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hashtag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topHashtags.map((hashtag, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{hashtag.hashtag}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{hashtag.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Engagement Statistics */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">📊 Engagement Statistics</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.engagementStats.average.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.engagementStats.highest.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Highest</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.engagementStats.lowest.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Lowest</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export async function streamComponent() {
  const result = await streamUI({
    model: openai('gpt-4o'),
    prompt: 'Analyze fashion trends from the viral social media dataset',
    text: ({ content }) => <div>{content}</div>,
    tools: {
      analyzeFashionDataset: {
        description: 'Analyze fashion trends from CSV dataset and extract insights into tables',
        parameters: z.object({
          datasetPath: z.string().describe('Path to the CSV dataset file'),
        }),
        generate: async function* ({ datasetPath }) {
          yield <LoadingComponent />;
          const analysisResult = await analyzeFashionDataset(datasetPath);
          return <FashionTableComponent data={analysisResult} />;
        },
      },
    },
  });

  return result.value;
}

// Usage in your component:
// const result = await streamComponent();

// File structure expected:
// public/
//   data/
//     viral-social-media-trends.csv

// You can call it like this in your page:
// import { streamComponent } from './actions';
// 
// export default function FashionPage() {
//   const [result, setResult] = useState(null);
//   
//   const handleAnalyze = async () => {
//     const analysisResult = await streamComponent();
//     setResult(analysisResult);
//   };
//   
//   return (
//     <div>
//       <button onClick={handleAnalyze}>Analyze Fashion Trends</button>
//       {result}
//     </div>
//   );
// }