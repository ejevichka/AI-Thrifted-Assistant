'use server';

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import Papa from 'papaparse';

// STEP 1: DEFINE THE ZOD SCHEMA & TYPES FOR AI OUTPUT
const aiInsightsSchema = z.object({
  analysisSummary: z.string().describe('A brief, insightful executive summary of the key findings from the data.'),
  futurePredictions: z.array(z.string()).describe('A list of 3 potential future trends that could emerge based on the current data.'),
  strategicRecommendations: z.array(z.string()).describe('A list of 3 actionable marketing or content recommendations for a brand in this space.'),
});

type AiInsights = z.infer<typeof aiInsightsSchema>;

// Original data interfaces
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

// STEP 2: CREATE THE getAiInsights FUNCTION
async function getAiInsights(analysisData: FashionAnalysisResult): Promise<AiInsights> {
  const simplifiedData = {
    topTrends: analysisData.trends,
    topPlatforms: analysisData.topPlatforms,
    topHashtags: analysisData.topHashtags,
    avgEngagement: analysisData.engagementStats.average.toFixed(1),
  };

  const { object: aiInsights } = await generateObject({
    model: openai('gpt-4o'),
    schema: aiInsightsSchema,
    prompt: `You are a senior fashion market analyst. Based on the following data summary from a social media dataset, provide a concise and insightful analysis.
    
    Data:
    ${JSON.stringify(simplifiedData, null, 2)}
    
    Your tasks:
    1.  Write a brief executive summary of the key findings.
    2.  List three data-driven predictions for future trends.
    3.  Provide three actionable strategic recommendations for a fashion brand.`,
  });

  return aiInsights;
}

// The analyzeFashionDataset function remains unchanged
const analyzeFashionDataset = async (csvContent: string): Promise<FashionAnalysisResult> => {
  // ... (no changes to this function)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const parseResult = Papa.parse(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    
    const rawData = parseResult.data as any[];
    
    if (!rawData || rawData.length === 0) {
      throw new Error('No data found in CSV file');
    }
    
    const fashionKeywords = [
      'fashion', 'style', 'outfit', 'clothing', 'dress', 'shirt', 'pants', 
      'shoes', 'accessories', 'jewelry', 'handbag', 'makeup', 'beauty',
      'skincare', 'hair', 'nails', 'aesthetic', 'ootd', 'lookbook',
      'thrift', 'vintage', 'designer', 'brand', 'trendy', 'chic',
      'minimalist', 'maximalist', 'streetwear', 'formal', 'casual',
      'cottagecore', 'y2k', 'grunge', 'preppy', 'bohemian', 'gothic',
      'sustainable', 'ethical', 'slow fashion', 'fast fashion'
    ];
    
    const fashionData = rawData.filter(row => {
      const rowText = Object.values(row).join(' ').toLowerCase();
      return fashionKeywords.some(keyword => rowText.includes(keyword));
    });
    
    const dataToAnalyze = fashionData.length > 0 ? fashionData : rawData;
    
    const sampleRow = rawData[0] || {};
    const columns = Object.keys(sampleRow);
    
    const trendCol = columns.find(col => 
      ['trend', 'title', 'content', 'description', 'name', 'topic', 'text'].some(keyword => 
        col.toLowerCase().includes(keyword)
      )
    ) || columns[0];
    
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
    
    const trends: FashionTrend[] = dataToAnalyze
      .filter(row => {
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


// STEP 3: UPDATE THE UI COMPONENT TO BE COMPLETE
interface ReportProps {
  data: FashionAnalysisResult;
  aiInsights: AiInsights;
}

const AnalysisReportComponent = ({ data, aiInsights }: ReportProps) => (
  <div className="max-w-6xl mx-auto p-6 space-y-8 text-gray-800">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-2">Trend Analysis Report</h2>
      <p className="text-gray-600">
        Analyzed {data.fashionRecords} relevant records from {data.totalRecords} total.
      </p>
    </div>

    {/* AI Insights Section */}
    <div className="bg-purple-50 rounded-lg shadow-lg overflow-hidden border border-purple-200">
      <div className="px-6 py-4 bg-purple-100 border-b border-purple-200">
        <h3 className="text-lg font-semibold text-purple-800 flex items-center">
          <span className="mr-2">🧠</span> AI-Powered Insights
        </h3>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Executive Summary</h4>
          <p className="text-gray-700 leading-relaxed">{aiInsights.analysisSummary}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Future Predictions</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {aiInsights.futurePredictions.map((prediction, index) => <li key={index}>{prediction}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Strategic Recommendations</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {aiInsights.strategicRecommendations.map((rec, index) => <li key={index}>{rec}</li>)}
          </ul>
        </div>
      </div>
    </div>
    
    <div className="text-center pt-4 border-t border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800">Detailed Data Breakdown</h3>
    </div>
    
    {/* ✅ ALL ORIGINAL TABLES ARE NOW INCLUDED HERE */}

    {/* Top Trends/Content Table */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Top Content/Trends</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.trends.map((trend, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{trend.hashtags}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {trend.platform}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{trend.engagement}</td>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
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
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: platform.percentage }}></div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
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

  </div>
);


// STEP 4: UPDATE THE MAIN EXPORTED FUNCTION TO ORCHESTRATE THE FLOW
export async function analyzeAndGetReport(csvContent: string) {
  try {
    // 1. Get the quantitative data
    const analysisResult = await analyzeFashionDataset(csvContent);

    // 2. Use that data to get qualitative AI insights
    const aiInsights = await getAiInsights(analysisResult);

    // 3. Return the component with both sets of data
    return <AnalysisReportComponent data={analysisResult} aiInsights={aiInsights} />;

  } catch (error) {
    // Standard error handling
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Error</h3>
          <p className="text-red-700">
            {error instanceof Error ? error.message : 'Failed to analyze the file or get AI insights'}
          </p>
        </div>
      </div>
    );
  }
}