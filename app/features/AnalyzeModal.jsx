'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import AnalyzeBids from './AnalyzeBids';

const AnalyzeModal = ({ isOpen, onClose, bid, projectId }) => {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Don't render anything if modal should be closed or no bid is provided
  if (!isOpen || !bid) return null;
  
  const analyzeBid = async () => {
    setProcessing(true);
    setError(null);

    try {
      console.log("Starting analysis for bid:", bid.name);
      
      // Send the request to analyze the bid by ID
      const response = await fetch('/api/analyze-bids/by-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidId: bid._id,
          projectId: projectId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze bid');
      }

      const analysisResults = await response.json();
      setResults(analysisResults);
      
      // Update the bid record with the analysis results
      await fetch(`/api/projects/${projectId}/bids/${bid._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'analyzed',
          totalCost: analysisResults.bidComparison[0].totalCost,
          keyComponents: analysisResults.bidComparison[0].keyComponents,
          analysisResults
        }),
      });

      // Notify parent component
      onClose(analysisResults);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium">Analyze Bid: {bid.bidder || bid.name || 'Selected Bid'}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {!processing && !results && !error && (
            <div className="text-center py-6">
              <p className="mb-4">Ready to analyze {bid.name}</p>
              <button
                onClick={analyzeBid}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Analysis
              </button>
              <p className="text-xs text-gray-500 mt-4">
                The system will analyze this bid document to extract costs and provide recommendations.
              </p>
            </div>
          )}
          
          {processing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="font-medium">Analyzing bid document...</p>
              <p className="text-sm text-gray-500 mt-1">This may take a minute or two.</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              <p className="font-medium mb-2">Error analyzing bid</p>
              <p>{error}</p>
              <button
                onClick={analyzeBid}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}
          
          {results && (
            <div>
              <div className="flex items-center mb-4 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="font-medium">Analysis Complete!</p>
              </div>
              <p>The analysis has been completed successfully. You can now view the detailed results.</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyzeModal;