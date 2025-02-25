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

  const handleFileUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file first');
      return;
    }
    
    setUploadLoading(true);
    
    try {
      // First, create a bid record in the database
      const bidMetadata = {
        name: uploadFile.name,
        bidder: uploadFile.name.split('.')[0].replace(/_/g, ' '), // Extract bidder name from filename for demo
        projectId: project._id,
        status: 'pending'
      };
      
      const bidResponse = await fetch(`/api/projects/${project._id}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bidMetadata),
      });
      
      if (!bidResponse.ok) {
        throw new Error('Failed to create bid record');
      }
      
      const bidData = await bidResponse.json();
      
      // Refresh bids to show the new one
      const updatedBidsResponse = await fetch(`/api/projects/${project._id}/bids`);
      const updatedBids = await updatedBidsResponse.json();
      setBids(updatedBids);
      
      setShowUploadModal(false);
      setUploadFile(null);
      
      // Show success message
      alert('Bid uploaded successfully! You can now analyze it.');
    } catch (error) {
      console.error('Error uploading bid:', error);
      alert(`Failed to upload bid: ${error.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

export default BidUpload;