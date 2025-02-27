'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Loader, UploadCloud } from 'lucide-react';
import TokenReductionIndicator from './TokenReductionIndicator';

const MultipleBidsAnalysis = ({ projectId }) => {
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
      // Feature coming soon message
      setTimeout(() => {
        setError('This feature is still in development. Please use the individual bid analysis for now.');
        setProcessing(false);
      }, 2000);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
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
    </div>
  );
};

export default MultipleBidsAnalysis;