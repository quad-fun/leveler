'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import TokenReductionIndicator from './TokenReductionIndicator';
import ExportResults from './ExportResults';


const AnalyzeBids = ({ bidFile, projectId, bidId, onAnalysisComplete }) => {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const analyzeBid = async () => {
    if (!bidFile) {
      setError('Please select a file to analyze');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Read the file content
      const fileContent = await bidFile.text();
      
      // Send the file for analysis
      const response = await fetch('/api/analyze-bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContents: [
            {
              name: bidFile.name,
              content: fileContent
            }
          ],
          bidId,
          projectId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze bid');
      }

      const analysisResults = await response.json();
      setResults(analysisResults);
      
      // Update the bid record with the analysis results
      await fetch(`/api/projects/${projectId}/bids/${bidId}`, {
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
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResults);
      }

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium mb-4">Bid Analysis</h2>
      
      {!processing && !results && (
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">{bidFile?.name || 'Selected Bid File'}</p>
              <p className="text-sm text-gray-500">{bidFile?.size ? `${Math.round(bidFile.size / 1024)} KB` : 'No file selected'}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">
            The system will analyze the bid document to extract key information and provide recommendations.
          </p>
          
          <button
            onClick={analyzeBid}
            disabled={processing || !bidFile}
            className={`mt-4 w-full py-2 rounded-lg ${
              !bidFile
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {processing ? 'Analyzing...' : 'Analyze Bid'}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>
      )}
      
      {processing && (
        <div className="text-center py-8">
          <Loader className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="font-medium">Analyzing bid document...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a minute or two.</p>
        </div>
      )}
      
      {results && (
        <div>
          <div className="flex items-center mb-6">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-xl font-medium">Analysis Complete</h3>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">Summary</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-2">
                <span className="font-medium">Recommended Bid:</span> {results.summary.recommendedBid}
              </p>
              <p className="mb-2">
                <span className="font-medium">Total Cost:</span> ${results.summary.totalCost?.toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Reasoning:</span> {results.summary.reasoning}
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">Cost Analysis</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bidder</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Materials</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Labor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Overhead</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.bidComparison.map((bid, index) => (
                    <tr key={index} className={index === 0 ? "bg-green-50" : ""}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {bid.bidder}
                        {index === 0 && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Recommended
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        ${bid.totalCost?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">
                        ${bid.keyComponents?.materials?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">
                        ${bid.keyComponents?.labor?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">
                        ${bid.keyComponents?.overhead?.toLocaleString() || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        
          
          {results && (
            <div>
              <div className="flex items-center mb-6">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-xl font-medium">Analysis Complete</h3>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium mb-2">Summary</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-2">
                    <span className="font-medium">Recommended Bid:</span> {results.summary.recommendedBid}
                  </p>
                  <p className="mb-2">
                    <span className="font-medium">Total Cost:</span> ${results.summary.totalCost?.toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Reasoning:</span> {results.summary.reasoning}
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium mb-2">Cost Analysis</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bidder</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Materials</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Labor</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Overhead</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.bidComparison.map((bid, index) => (
                        <tr key={index} className={index === 0 ? "bg-green-50" : ""}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {bid.bidder}
                            {index === 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                                Recommended
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            ${bid.totalCost?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">
                            ${bid.keyComponents?.materials?.toLocaleString() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">
                            ${bid.keyComponents?.labor?.toLocaleString() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">
                            ${bid.keyComponents?.overhead?.toLocaleString() || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-2">Risk Assessment</h4>
                  <ul className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {results.risks.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block h-2 w-2 bg-yellow-500 rounded-full mt-1.5 mr-2"></span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {results.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block h-2 w-2 bg-blue-500 rounded-full mt-1.5 mr-2"></span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <ExportResults results={results} />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium mb-2">Risk Assessment</h4>
              <ul className="bg-gray-50 p-4 rounded-lg space-y-2">
                {results.risks.map((risk, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block h-2 w-2 bg-yellow-500 rounded-full mt-1.5 mr-2"></span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="bg-gray-50 p-4 rounded-lg space-y-2">
                {results.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block h-2 w-2 bg-blue-500 rounded-full mt-1.5 mr-2"></span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzeBids;