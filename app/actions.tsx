'use server';

import { streamUI } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
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

const analyzeFashionDataset = async (csvContent: string): Promise<FashionAnalysisResult> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Parse CSV content directly
    const parseResult = Papa.parse(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    
    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors);
    }
    
    const rawData = parseResult.data as any[];
    
    if (!rawData || rawData.length === 0) {
      throw new Error('No data found in CSV file');
    }
    
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
    
    // If no fashion data found, use all data
    const dataToAnalyze = fashionData.length > 0 ? fashionData : rawData;
    
    // Find relevant columns dynamically
    const sampleRow = rawData[0] || {};
    const columns = Object.keys(sampleRow);
    
    const trendCol = columns.find(col => 
      ['trend', 'title', 'content', 'description', 'name', 'topic', 'text'].some(keyword => 
        col.toLowerCase().includes(keyword)
      )
    ) || columns[0]; // Fallback to first column
    
    const platformCol = columns.find(col => 
      col.toLowerCase().includes('platform')
    );
    
    const engagementCol = columns.find(col => 
      ['engagement', 'rate', 'score', 'likes', 'views', 'shares', 'count'].some(keyword => 
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
    const trends: FashionTrend[] = dataToAnalyze
      .filter(row => {
        // Filter out rows with empty trend content
        const trendValue = trendCol ? row[trendCol] : '';
        return trendValue && String(trendValue).trim().length > 0;
      })
      .filter(row => engagementCol ? !isNaN(parseFloat(row[engagementCol])) : true)
      .sort((a, b) => {
        if (engagementCol) {
          const aVal = parseFloat(a[engagementCol]) || 0;
          const bVal = parseFloat(b[engagementCol]) || 0;
          return bVal - aVal;
        }
        return 0;
      })
      .slice(0, 10)
      .map(row => ({
        trend: trendCol ? String(row[trendCol]).substring(0, 80) + (String(row[trendCol]).length > 80 ? '...' : '') : 'N/A',
        platform: platformCol ? String(row[platformCol]) : 'Unknown',
        engagement: engagementCol ? parseFloat(row[engagementCol]).toFixed(1) : 'N/A',
        category: categoryCol ? String(row[categoryCol]) : undefined,
        hashtags: hashtagCol ? String(row[hashtagCol]) : undefined,
      }));
    
    // Calculate platform distribution
    const platformCounts: Record<string, number> = {};
    dataToAnalyze.forEach(row => {
      const platform = platformCol ? String(row[platformCol]) : 'Unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });
    
    const topPlatforms = Object.entries(platformCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([platform, count]) => ({
        platform,
        count,
        percentage: `${((count / dataToAnalyze.length) * 100).toFixed(1)}%`
      }));
    
    // Extract top hashtags
    const hashtagCounts: Record<string, number> = {};
    if (hashtagCol) {
      dataToAnalyze.forEach(row => {
        const hashtags = row[hashtagCol];
        if (hashtags && typeof hashtags === 'string') {
          const tags = hashtags.replace(/#/g, '').split(/[,\s]+/);
          tags.forEach(tag => {
            const cleanTag = tag.trim().toLowerCase();
            if (cleanTag && cleanTag.length > 2) {
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
      dataToAnalyze
        .map(row => parseFloat(row[engagementCol]))
        .filter(val => !isNaN(val) && val > 0)
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
      fashionRecords: dataToAnalyze.length,
      topPlatforms,
      topHashtags,
      engagementStats
    };
    
  } catch (error) {
    console.error('Error analyzing fashion dataset:', error);
    throw new Error(`Failed to analyze CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

interface FashionTableProps {
  data: FashionAnalysisResult;
}

const FashionTableComponent = ({ data }: FashionTableProps) => (
  <div className="max-w-6xl mx-auto p-6 space-y-8">
    {/* Header */}
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">CSV Data Analysis Results</h2>
      <p className="text-gray-600">
        Analyzed {data.fashionRecords} relevant records from {data.totalRecords} total records
        {data.fashionRecords !== data.totalRecords && (
          <span className="text-sm text-blue-600 ml-2">
            (Filtered for fashion/trend content)
          </span>
        )}
      </p>
    </div>

    {/* Summary Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-blue-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-blue-600">{data.fashionRecords}</div>
        <div className="text-sm text-gray-600">Records Analyzed</div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-green-600">{data.engagementStats.average.toFixed(1)}</div>
        <div className="text-sm text-gray-600">Avg Engagement</div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-purple-600">{data.topPlatforms.length}</div>
        <div className="text-sm text-gray-600">Data Sources</div>
      </div>
    </div>

    {/* Top Trends/Content Table */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">🔥 Top Content/Trends</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
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

    {/* Platform/Source Distribution */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">📊 Data Source Distribution</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
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
          <h3 className="text-lg font-semibold text-gray-900">🏷️ Top Tags/Keywords</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tag
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
    {data.engagementStats.average > 0 && (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">📈 Engagement Statistics</h3>
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
    )}
  </div>
);

export async function streamComponent(csvContent: string) {
  // Directly analyze the CSV content and return the result
  try {
    const analysisResult = await analyzeFashionDataset(csvContent);
    return <FashionTableComponent data={analysisResult} />;
  } catch (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Error</h3>
          <p className="text-red-700">
            {error instanceof Error ? error.message : 'Failed to analyze the CSV file'}
          </p>
          <p className="text-sm text-red-600 mt-2">
            Please check that your CSV file has proper headers and contains valid data.
          </p>
        </div>
      </div>
    );
  }
}