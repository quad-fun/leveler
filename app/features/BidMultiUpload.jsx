// app/features/BidMultiUpload.jsx
'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader, FileSpreadsheet, File, FileArchive } from 'lucide-react';
import TokenReductionIndicator from './TokenReductionIndicator';
import { useNotification } from '../context/NotificationContext';
import { extractBidderFromFilename, formatFileSize, validateFileType, getFileTypeIcon } from '../utils/fileUtils';

const BidMultiUpload = ({ projectId, onUploadsComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { showSuccess, showError, showInfo } = useNotification();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Validate file types
      const allowedTypes = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.txt', 'application/pdf'];
      const invalidFiles = newFiles.filter(file => !validateFileType(file, allowedTypes));
      
      if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map(f => f.name).join(', ');
        showError(
          `${invalidFiles.length} invalid file${invalidFiles.length > 1 ? 's' : ''}`, 
          { details: `Only PDF, Word, Excel, and text files are supported. Invalid: ${invalidNames}` }
        );
        
        // Filter out invalid files
        const validFiles = newFiles.filter(file => validateFileType(file, allowedTypes));
        setFiles([...files, ...validFiles]);
        
        if (validFiles.length === 1) {
          showInfo(`Added file: ${validFiles[0].name}`);
        } else if (validFiles.length > 1) {
          showInfo(`Added ${validFiles.length} files`);
        }
      } else {
        // All files are valid
        setFiles([...files, ...newFiles]);
        
        if (newFiles.length === 1) {
          showInfo(`Added file: ${newFiles[0].name}`);
        } else {
          showInfo(`Added ${newFiles.length} files`);
        }
      }
    }
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (file, index) => {
    try {
      // Update progress for this file
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { status: 'uploading', progress: 0 }
      }));
      
      // Step 1: Create bid entry in database
      const bidMetadata = {
        name: file.name,
        bidder: extractBidderFromFilename(file.name),
        projectId
      };
      
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
      showInfo(`Created bid record for: ${file.name}`, { duration: 2000 });
      
      // Update progress - bid created
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { status: 'uploading', progress: 33 }
      }));
      
      // Step 2: Read the file and analyze it
      const fileContent = await file.text();
      
      // Update progress - file read
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { status: 'uploading', progress: 66 }
      }));
      
      // Step 3: Send for analysis
      const analysisResponse = await fetch(`/api/analyze-bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContents: [{
            name: file.name,
            content: fileContent
          }],
          bidId: bidData._id
        }),
      });
      
      if (!analysisResponse.ok) {
        throw new Error(`Failed to analyze bid: ${file.name}`);
      }
      
      // Update progress - completed
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { status: 'complete', progress: 100 }
      }));
      
      return bidData;
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      
      // Update progress - error
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { status: 'error', error: error.message }
      }));
      
      showError(`Error processing: ${file.name}`, { 
        details: error.message,
        duration: 5000
      });
      
      throw error;
    }
  };

  const handleUploadAll = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      showError('Please select at least one file to upload');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      showInfo(
        `Starting upload and analysis of ${files.length} file${files.length > 1 ? 's' : ''}`,
        { autoClose: true, duration: 3000 }
      );
      
      // Process files sequentially to avoid overwhelming the API
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < files.length; i++) {
        try {
          const result = await processFile(files[i], i);
          results.push(result);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error processing file ${files[i].name}:`, error);
        }
      }
      
      // All files processed
      setTimeout(() => {
        if (successCount > 0) {
          showSuccess(`Successfully processed ${successCount} of ${files.length} bids`);
        }
        
        if (errorCount > 0) {
          showError(`Failed to process ${errorCount} bid${errorCount > 1 ? 's' : ''}`);
        }
        
        onUploadsComplete?.(results);
        setFiles([]);
        setUploadProgress({});
      }, 1000);
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Some files failed to upload. Please check the list for details.');
      showError('Upload process encountered errors', { 
        details: error.message,
        autoClose: false
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium mb-4">Upload Multiple Bids</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onClick={handleSelectFiles}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-1">Drag and drop bid documents here</p>
          <p className="text-sm text-gray-500">or click to browse (PDF, DOCX, XLSX)</p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.docx,.xlsx,.xls,.txt"
            className="hidden"
          />
        </div>
        
        <TokenReductionIndicator processing={uploading} />
      </div>
      
      {files.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Selected Files ({files.length})</h3>
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {files.map((file, index) => {
              const progress = uploadProgress[file.name];
              
              return (
                <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <div className="flex items-center">
                    {getFileTypeIcon(file.name) === 'FileText' && <FileText className="w-5 h-5 text-gray-400 mr-2" />}
                    {getFileTypeIcon(file.name) === 'FileSpreadsheet' && <FileSpreadsheet className="w-5 h-5 text-gray-400 mr-2" />}
                    {getFileTypeIcon(file.name) === 'FileArchive' && <FileArchive className="w-5 h-5 text-gray-400 mr-2" />}
                    {getFileTypeIcon(file.name) === 'File' && <File className="w-5 h-5 text-gray-400 mr-2" />}
                    <div>
                      <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {progress ? (
                      progress.status === 'complete' ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : progress.status === 'error' ? (
                        <div className="flex items-center text-red-500 text-xs">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Error
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${progress.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 w-10">{progress.progress}%</p>
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleUploadAll}
          disabled={files.length === 0 || uploading}
          className={`flex items-center px-4 py-2 rounded-lg ${
            files.length === 0 || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {uploading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Uploading & Analyzing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Analyze All
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BidMultiUpload;