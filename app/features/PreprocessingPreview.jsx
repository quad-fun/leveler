'use client';

import React, { useState } from 'react';
import { preprocessBidDocuments } from '../utils/bidPreprocessor';

const PreprocessingPreview = ({ files }) => {
  const [preprocessingResults, setPreprocessingResults] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

 Convert files to format needed by preprocessor
      const fileContents = await Promise.all(
        files.map(async (file) => {
          const text = await file.text();
          return {
            name: file.name,
            content: text
          };
        })
      );

      // Run preprocessing
      const preprocessed = preprocessBidDocuments(fileContents, {
        maxContentLength: 12000,
        removeBoilerplate: true,
        extractKeyInfo: true,
        summarizeLongSections: true
      });

      // Calculate statistics
      const results = preprocessed.map((processed, index) => {
        const originalSize = processed.originalSize;
        const processedSize = processed.content.length;
        const reduction = originalSize - processedSize;
        const reductionPercent = ((reduction / originalSize) * 100).toFixed(1);
        
        // Estimate tokens (4 chars per token is a rough estimate)
        const originalTokens = Math.ceil(originalSize / 4);
        const processedTokens = Math.ceil(processedSize / 4);
        const tokenReduction = originalTokens - processedTokens;
        
        return {
          name: processed.name,
          originalSize,
          processedSize,
          reduction,
          reductionPercent,
          originalTokens,
          processedTokens,
          tokenReduction
        };
      });

      // Calculate totals
      const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
      const totalProcessedSize = results.reduce((sum, r) => sum + r.processedSize, 0);
      const totalReduction = totalOriginalSize - totalProcessedSize;
      const totalReductionPercent = ((totalReduction / totalOriginalSize) * 100).toFixed(1);
      const totalOriginalTokens = results.reduce((sum, r) => sum + r.originalTokens, 0);
      const totalProcessedTokens = results.reduce((sum, r) => sum + r.processedTokens, 0);
      
      setPreprocessingResults({
        files: results,
        totals: {
          originalSize: totalOriginalSize,
          processedSize: totalProcessedSize,
          reduction: totalReduction,
          reductionPercent: totalReductionPercent,
          originalTokens: totalOriginalTokens,
          processedTokens: totalProcessedTokens,
          tokenReduction: totalOriginalTokens - totalProcessedTokens
        }
      });
    } catch (error) {
      console.error('Preprocessing preview error:', error);
    }
  };

  return (
    <div className="mt-4">
      {!preprocessingResults ? (
        <button
          onClick={previewPreprocessing}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          disabled={!files || files.length === 0}
        >
          Preview Token Optimization
        </button>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-medium mb-2">Token Optimization Preview</h4>
          
          <div className="bg-white p-3 rounded border mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Total Reduction:</p>
                <p className="text-2xl font-bold text-green-600">
                  {preprocessingResults.totals.reductionPercent}% 
                  <span className="text-sm font-normal ml-1 text-gray-500">
                    ({preprocessingResults.totals.tokenReduction.toLocaleString()} tokens saved)
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Before: {preprocessingResults.totals.originalTokens.toLocaleString()} tokens</p>
                <p className="text-sm text-gray-500">After: {preprocessingResults.totals.processedTokens.toLocaleString()} tokens</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          {showDetails && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">File</th>
                    <th className="px-4 py-2 text-right">Original Size</th>
                    <th className="px-4 py-2 text-right">Processed Size</th>
                    <th className="px-4 py-2 text-right">Reduction</th>
                    <th className="px-4 py-2 text-right">Tokens Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {preprocessingResults.files.map((result, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2 font-medium truncate max-w-xs">
                        {result.name}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {result.originalSize.toLocaleString()} chars
                      </td>
                      <td className="px-4 py-2 text-right">
                        {result.processedSize.toLocaleString()} chars
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {result.reductionPercent}%
                      </td>
                      <td className="px-4 py-2 text-right text-green-600">
                        {result.tokenReduction.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreprocessingPreview;