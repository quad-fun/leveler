import { getTokenUsageStats, estimateGPT4Cost } from '../../utils/tokenTracker';

// This route provides token usage statistics
export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const model = searchParams.get('model');
    const endpoint = searchParams.get('endpoint');
    
    // Get token usage statistics
    const stats = getTokenUsageStats({
      startDate,
      endDate,
      model,
      endpoint
    });
    
    // Add cost estimation
    const estimatedCost = estimateGPT4Cost(stats.totalInputTokens, stats.totalOutputTokens);
    
    return Response.json({
      ...stats,
      estimatedCost: {
        usd: estimatedCost.toFixed(4),
        formatted: `$${estimatedCost.toFixed(2)}`
      },
      filters: {
        startDate,
        endDate,
        model,
        endpoint
      },
      timeRange: {
        from: startDate || 'all time',
        to: endDate || 'present'
      }
    });
  } catch (error) {
    console.error('Token usage stats error:', error);
    return Response.json({ 
      error: 'Failed to get token usage statistics',
      message: error.message
    }, { status: 500 });
  }
}