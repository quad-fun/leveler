// app/features/AnalyzeBids.jsx
'use client';

import React, { useState } from 'react';
import { PlayCircle, AlertCircle, CheckCircle, Loader, FileText } from 'lucide-react';

const AnalyzeBids = ({ projectId, bids, selectedBids, onComplete }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBid, setCurrentBid] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Filter bids that are eligible for analysis (not already analyzed or processing)
  const eligibleBids = bids.filter(bid => 
    (selectedBids.includes(bid._id) || selectedBids.length === 0) && 
    bid.status !== 'analyzed' && 
    bid.status !== 'processing'
  );

  const handleAnalyzeAll = async () => {
    if (eligibleBids.length === 0) {
      setError("No eligible bids to analyze. Bids must be pending and not already analyzed.");
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setResults([]);
    setError(null);

    const processedResults = [];

    for (let i = 0; i < eligibleBids.length; i++) {
      const bid = eligibleBids[i];
      setCurrentBid(bid);
      setProgress(Math.round((i / eligibleBids.length) * 100));

      try {
        // Simulate API call for demo purposes
        // In production, this would be a real API call to analyze the bid
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update bid status in UI
        processedResults.push({
          bidId: bid._id,
          bidder: bid.bidder,
          status: 'analyzed',
          success: true
        });
      } catch (err) {
        console.error(`Error analyzing bid ${bid._id}:`, err);
        processedResults.push({
          bidId: bid._id,
          bidder: bid.bidder,
          status: 'error',
          success: false,
          error: err.message
        });
      }
    }

    setProgress(100);
    setResults(processedResults);
    setAnalyzing(false);
    
    if (onComplete) {
      onComplete(processedResults);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">Analyze Bids</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-gray-600">
          {selectedBids.length > 0 
            ? `Analyze ${selectedBids.length} selected bid${selectedBids.length !== 1 ? 's' : ''}` 
            : 'Analyze all pending bids'}
        </p>
        
        {eligibleBids.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-gray-500">
            {eligibleBids.map(bid => (
              <li key={bid._id} className="flex items-center">
                <FileText className="w-4 h-4 mr-1 text-blue-500" />
                {bid.bidder || bid.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-yellow-600">
            No eligible bids found. Bids must be in pending status and not already analyzed.
          </p>
        )}
      </div>
      
      {analyzing && (
        <div className="mb-4">
          <div className="flex justify-between mb-1 text-sm">
            <span>Analyzing: {currentBid ? (currentBid.bidder || currentBid.name) : ''}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {results.length > 0 && !analyzing && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">Results:</h3>
          <ul className="space-y-2">
            {results.map(result => (
              <li 
                key={result.bidId} 
                className={`flex items-center p-2 rounded-md ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                )}
                <div>
                  <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                    {result.bidder || 'Unnamed bid'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {result.success 
                      ? 'Analysis completed successfully' 
                      : `Error: ${result.error || 'Analysis failed'}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleAnalyzeAll}
          disabled={analyzing || eligibleBids.length === 0}
          className={`flex items-center px-4 py-2 rounded-lg ${
            analyzing || eligibleBids.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {analyzing ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-2" />
              {eligibleBids.length === 0 
                ? 'No Bids to Analyze' 
                : `Analyze ${eligibleBids.length} Bid${eligibleBids.length !== 1 ? 's' : ''}`}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AnalyzeBids;