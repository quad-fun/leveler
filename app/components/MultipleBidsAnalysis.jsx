'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Loader, UploadCloud } from 'lucide-react';
import TokenReductionIndicator from './TokenReductionIndicator';
import ExportResults from './ExportResults';
import BidComparisonChart from './BidComparisonChart';

const MultipleBidsAnalysis = ({ projectId, onAnalysisComplete }) => {
  const [bidFiles, setBidFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setBidFiles([...bidFiles, ...newFiles]);
    }
  };

  const removeBidFile = (index) => {
    const newFiles = [...bidFiles];
    newFiles.splice(index, 1);
    setBidFiles(newFiles);
  };

  const analyzeBids = async () => {
    if (bidFiles.length < 2) {
      setError('Please select at least two bid files to compare');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Read all file contents
      const fileContents = await Promise.all(
        bidFiles.map(async (file) => {
          const content = await file.text();
          return {
            name: file.name,
            content: content
          };
        })
      );
      
      // Send the files for analysis
      const response = await fetch('/api/analyze-multiple-bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContents,
          projectId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze bids');
      }

      const analysisResults = await response.json();
      setResults(analysisResults);
      
      // Save analysis results for each bid
      const saveBidAnalysisPromises = analysisResults.bidComparison.map(async (bidComparison, index) => {
        const bidMetadata = {
          name: bidFiles[index].name,
          bidder: bidComparison.bidder,
          projectId,
          status: 'analyzed',
          totalCost: bidComparison.totalCost,
          keyComponents: bidComparison.keyComponents,
          analysisResults: {
            summary: analysisResults.summary,
            bidComparison: [bidComparison],
            risks: analysisResults.risks,
            recommendations: analysisResults.recommendations
          }
        };
        
        try {
          await fetch(`/api/projects/${projectId}/bids`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bidMetadata),
          });
        } catch (err) {
          console.error(`Error saving bid analysis for ${bidComparison.bidder}:`, err);
        }
      });
      
      await Promise.all(saveBidAnalysisPromises);

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
      <h2 className="text-lg font-medium mb-4">Multiple Bid Analysis</h2>
      
      {!processing && !results && (
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 hover:border-blue-500 transition-colors">
            <div className="text-center mb-4">
              <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="font-medium">Upload Multiple Bid Documents for Comparison</p>
              <p className="text-sm text-gray-500 mt-1">Select 2 or more bid files</p>
            </div>
            
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.csv,.txt"
              className="hidden"
              id="bid-file-input"
              multiple
            />
            <label 
              htmlFor="bid-file-input"
              className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Select Bid Files
            </label>
          </div>
          
          {bidFiles.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Selected Files ({bidFiles.length})</h3>
              <ul className="space-y-2">
                {bidFiles.map((file, index) => (
                  <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-500 mr-2" />
                      <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                    </div>
                    <button
                      onClick={() => removeBidFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <TokenReductionIndicator processing={processing} />
          
          <button
            onClick={analyzeBids}
            disabled={processing || bidFiles.length < 2}
            className={`mt-4 w-full py-2 rounded-lg ${
              bidFiles.length < 2
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {processing ? 'Analyzing...' : 'Compare Bids'}
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
          <p className="font-medium">Analyzing {bidFiles.length} bid documents...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few minutes.</p>
          <TokenReductionIndicator processing={true} />
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
            <h4 className="font-medium mb-2">Bid Comparison</h4>
            <BidComparisonChart bids={results.bidComparison} />
            <div className="overflow-x-auto mt-4">
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
                    <tr key={index} className={bid.bidder === results.summary.recommendedBid ? "bg-green-50" : ""}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {bid.bidder}
                        {bid.bidder === results.summary.recommendedBid && (
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {results.bidComparison.map((bid, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{bid.bidder}</h4>
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-green-600 mb-1">Strengths</h5>
                  <ul className="bg-gray-50 p-3 rounded-lg space-y-1">
                    {bid.strengths && bid.strengths.length > 0 ? (
                      bid.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="inline-block h-2 w-2 bg-green-500 rounded-full mt-1.5 mr-2"></span>
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">No specific strengths highlighted</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-red-600 mb-1">Weaknesses</h5>
                  <ul className="bg-gray-50 p-3 rounded-lg space-y-1">
                    {bid.weaknesses && bid.weaknesses.length > 0 ? (
                      bid.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="inline-block h-2 w-2 bg-red-500 rounded-full mt-1.5 mr-2"></span>
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">No specific weaknesses highlighted</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          
          <ExportResults results={results} />
        </div>
      )}
    </div>
  );
};

export default MultipleBidsAnalysis; 