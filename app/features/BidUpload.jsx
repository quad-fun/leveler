'use client';

import React, { useState } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import TokenReductionIndicator from './TokenReductionIndicator';

// Format large numbers with commas and abbreviate if necessary
function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'N/A';
  
  // Check if we should abbreviate (for millions)
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else {
    return `$${amount.toLocaleString()}`;
  }
}

const BidUpload = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
    // Clear results when new files are added
    setResults(null);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    // Clear results when files are removed
    setResults(null);
  };

  const analyzeBids = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);

    try {
      console.log('Starting analysis of files:', files.map(f => f.name));
      
      const fileContents = await Promise.all(
        files.map(async (file) => {
          console.log('Reading file:', file.name);
          const text = await file.text();
          console.log('Successfully read file:', file.name, 'Length:', text.length);
          return {
            name: file.name,
            content: text
          };
        })
      );

      const response = await fetch('/api/analyze-bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileContents }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const analysisResults = await response.json();
      setResults(analysisResults);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to analyze bids. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center cursor-pointer"
        >
          <Upload className="w-12 h-12 text-gray-400" />
          <span className="mt-2 text-sm text-gray-500">
            Upload Bid Documents
          </span>
          <span className="mt-1 text-xs text-gray-400">
            Upload PDFs, Word documents, or text files
          </span>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium">Uploaded Files</h4>
            <button
              onClick={analyzeBids}
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {processing ? 'Analyzing...' : 'Analyze Bids'}
            </button>
          </div>
          
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Trash2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Token Reduction Indicator */}
          <TokenReductionIndicator processing={processing} />
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
          
          <div className="space-y-6">
            {/* Summary Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900">Recommended Bid</h4>
              <p className="mt-2 text-blue-800">{results.summary.recommendedBid}</p>
              <p className="mt-2 text-blue-800">{formatCurrency(results.summary.totalCost)}</p>
              <p className="mt-1 text-sm text-blue-700">{results.summary.reasoning}</p>
            </div>

            {/* Bid Comparison */}
            <div>
              <h4 className="font-medium mb-2">Cost Comparison</h4>
              <div className="space-y-2">
                {results.bidComparison?.map((bid, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{bid.bidder}</span>
                      <span>{formatCurrency(bid.totalCost)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        Materials: {formatCurrency(bid.keyComponents?.materials)}
                      </div>
                      <div>
                        Labor: {formatCurrency(bid.keyComponents?.labor)}
                      </div>
                      <div>
                        Overhead: {formatCurrency(bid.keyComponents?.overhead)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900">Risk Factors</h4>
              <ul className="mt-2 space-y-1">
                {results.risks?.map((risk, index) => (
                  <li key={index} className="text-sm text-yellow-700">• {risk}</li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {results.recommendations?.map((rec, index) => (
                  <li key={index} className="text-sm">• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidUpload;