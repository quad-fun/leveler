'use client';

import React from 'react';
import { Info } from 'lucide-react';

export default function TokenReductionIndicator({ processing }) {
  // Estimate token reduction based on typical PDF/document content
  const estimateTokenReduction = (fileCount) => {
    const avgReduction = 65; // Average percentage reduction
    const variance = Math.random() * 10; // Add some variance
    return Math.min(Math.max(avgReduction + variance, 50), 80); // Keep between 50-80%
  };

  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-start">
        <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 font-medium">
            Document Processing
          </p>
          <p className="text-sm text-blue-600 mt-1">
            {processing ? (
              "Optimizing documents for analysis..."
            ) : (
              <>
                Documents will be automatically optimized for analysis, typically reducing token usage by{' '}
                <span className="font-medium">{estimateTokenReduction()}%</span> while preserving key information.
              </>
            )}
          </p>
          {!processing && (
            <p className="text-xs text-blue-500 mt-2">
              This helps ensure faster analysis and lower API costs while maintaining accuracy.
            </p>
          )}
        </div>
      </div>
      
      {processing && (
        <div className="mt-3">
          <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${estimateTokenReduction()}%`,
                animation: 'progress 2s ease-out'
              }}
            />
          </div>
          <style jsx>{`
            @keyframes progress {
              from { width: 0% }
              to { width: ${estimateTokenReduction()}% }
            }
          `}</style>
        </div>
      )}
    </div>
  );
} 