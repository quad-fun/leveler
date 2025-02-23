// File: app/features/monitoring/metrics.js
import { createMetricsLogger } from './logger';

const logger = createMetricsLogger();

export const BidMetrics = {
  // Track preprocessing effectiveness
  logPreprocessing: (bidName, stats) => {
    logger.log('preprocessing_metrics', {
      bid_name: bidName,
      original_tokens: stats.originalTokens,
      processed_tokens: stats.processedTokens,
      reduction_percent: stats.reductionPercent,
      timestamp: new Date().toISOString()
    });
  },

  // Track API costs
  logAPIUsage: (bidCount, totalTokens, cost) => {
    logger.log('api_usage', {
      bid_count: bidCount,
      total_tokens: totalTokens,
      estimated_cost: cost,
      timestamp: new Date().toISOString()
    });
  },

  // Track processing time
  logProcessingTime: (bidName, startTime) => {
    const duration = Date.now() - startTime;
    logger.log('processing_time', {
      bid_name: bidName,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    });
  },

  // Track errors
  logError: (bidName, error, phase) => {
    logger.log('errors', {
      bid_name: bidName,
      error_message: error.message,
      error_phase: phase,
      timestamp: new Date().toISOString()
    });
  }
};

// File: app/features/monitoring/logger.js
export function createMetricsLogger() {
  return {
    log: (metricType, data) => {
      // Console logging for development
      console.log(`[${metricType}]`, JSON.stringify(data, null, 2));

      // In production, you might want to send to a monitoring service
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to monitoring service
        sendToMonitoring(metricType, data);
      }
    }
  };
}

async function sendToMonitoring(metricType, data) {
  // Example integration with a monitoring service
  // Replace with your actual monitoring service
  if (process.env.MONITORING_ENDPOINT) {
    try {
      await fetch(process.env.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`
        },
        body: JSON.stringify({
          metric: metricType,
          data: data
        })
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }
}

// File: app/api/analyze-bid/route.js
import { BidMetrics } from '@/features/monitoring/metrics';

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { fileContents } = body;

    // Track preprocessing for each bid
    const preprocessedContents = fileContents.map(file => {
      const { processedText, stats, error } = preprocessBid(file.content);
      
      // Log preprocessing metrics
      BidMetrics.logPreprocessing(file.name, stats);

      if (error) {
        BidMetrics.logError(file.name, new Error(error), 'preprocessing');
      }

      return {
        ...file,
        content: truncateContent(processedText),
        preprocessingStats: stats
      };
    });

    // Calculate total tokens and estimated cost
    const totalTokens = preprocessedContents.reduce(
      (sum, file) => sum + file.preprocessingStats.processedTokens, 0
    );
    const estimatedCost = (totalTokens / 1000) * 0.02; // $0.02 per 1K tokens

    // Log API usage
    BidMetrics.logAPIUsage(
      preprocessedContents.length,
      totalTokens,
      estimatedCost
    );

    // Existing analysis code...
    const analysis = await analyzeWithRetry(prompt);

    // Log processing time
    preprocessedContents.forEach(file => {
      BidMetrics.logProcessingTime(file.name, startTime);
    });

    return Response.json({
      ...analysis,
      preprocessingStats: preprocessedContents.map(file => ({
        filename: file.name,
        ...file.preprocessingStats
      }))
    });

  } catch (error) {
    console.error('Bid analysis error:', error);
    BidMetrics.logError('system', error, 'analysis');
    return Response.json({ 
      error: 'Failed to analyze bids',
      message: error.message,
      retryIn: 60
    }, { status: error.status || 500 });
  }
}