'use client';

import React, { useState } from 'react';
import { Upload, FileText, Trash2, X } from 'lucide-react';
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

const BidUpload = ({ projectId, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e) => {
    if (e.target.files?.length > 0) {
      // Convert FileList to Array and add to existing files
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Process files sequentially
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Update progress as we process each file
        setUploadProgress(Math.round((i / files.length) * 100));
        
        // Create bid metadata
        const bidMetadata = {
          name: file.name,
          bidder: file.name.split('.')[0].replace(/_/g, ' '), // Extract bidder name from filename
          projectId: projectId
        };
        
        // Send metadata to create bid record
        const bidResponse = await fetch(`/api/projects/${projectId}/bids`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bidMetadata),
        });
        
        if (!bidResponse.ok) {
          throw new Error(`Failed to create bid record for ${file.name}`);
        }
        
        const bidData = await bidResponse.json();
        results.push(bidData);
      }
      
      // Complete the progress bar
      setUploadProgress(100);
      
      // Reset the form
      setFiles([]);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(results);
      }
      
      // Return results
      return results;
    } catch (err) {
      console.error('Error uploading bids:', err);
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">Upload Bid Documents</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {/* File selection area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          files.length > 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        {files.length === 0 ? (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-gray-500">Drag and drop bid documents here, or click to browse</p>
            <p className="text-xs text-gray-400">Supported formats: PDF, DOCX, XLSX</p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              accept=".pdf,.docx,.doc,.xlsx,.xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{files.length} file{files.length !== 1 ? 's' : ''} selected</h3>
              <button 
                onClick={() => setFiles([])}
                className="text-gray-400 hover:text-gray-600"
              >
                Clear All
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {files.map((file, index) => (
                <div 
                  key={`${file.name}-${index}`} 
                  className="flex items-center justify-between p-2 border-b"
                >
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm truncate max-w-xs">{file.name}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button 
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => document.querySelector('input[type="file"]').click()}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Add More Files
            </button>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              accept=".pdf,.docx,.doc,.xlsx,.xls"
              className="hidden"
            />
          </div>
        )}
      </div>
      
      {/* Token reduction indicator */}
      <TokenReductionIndicator processing={uploading} />
      
      {/* Upload progress bar (only visible when uploading) */}
      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Uploading ({uploadProgress}%)...
          </p>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className={`flex items-center px-4 py-2 rounded-lg ${
            files.length === 0 || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload All'}
        </button>
      </div>
    </div>
  );
};

export default BidUpload;