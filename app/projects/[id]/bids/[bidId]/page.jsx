'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building, Calendar, FileText, Download, ArrowRight } from 'lucide-react';
import AnalyzeModal from '../../../../features/AnalyzeModal';

export default function BidDetailsPage({ params }) {
  const { id, bidId } = params;
  
  const [project, setProject] = useState(null);
  const [bid, setBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzeModalOpen, setAnalyzeModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      // Check that we have both the project id and bid id
      if (!id || !bidId) {
        setError('Missing project ID or bid ID');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${id}`);
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project details');
        }
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Fetch bid details
        const bidResponse = await fetch(`/api/projects/${id}/bids/${bidId}`);
        if (!bidResponse.ok) {
          throw new Error('Failed to fetch bid details');
        }
        const bidData = await bidResponse.json();
        setBid(bidData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, bidId]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    
    // For millions, format as $XXM
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleAnalysisComplete = () => {
    // Refresh the bid data
    const fetchBid = async () => {
      try {
        const response = await fetch(`/api/projects/${id}/bids/${bidId}`);
        if (response.ok) {
          const updatedBid = await response.json();
          setBid(updatedBid);
        }
      } catch (error) {
        console.error('Error refreshing bid:', error);
      }
    };
    
    fetchBid();
    setAnalyzeModalOpen(false);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !project || !bid) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-20 bg-red-50 rounded-lg">
          <h3 className="text-lg font-medium text-red-700">{error || 'Bid or project not found'}</h3>
          <Link href={`/projects/${id}`} className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            Back to Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link href={`/projects/${id}`} className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Project
        </Link>
      </div>

      {/* Bid header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h1 className="text-2xl font-bold">{bid.bidder || 'Unnamed Bid'}</h1>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <FileText className="w-4 h-4 mr-1" />
              <span>{bid.name}</span>
              <span className="mx-2">•</span>
              <Calendar className="w-4 h-4 mr-1" />
              <span>Submitted on {formatDate(bid.submittedAt)}</span>
            </div>
            <Link href={`/projects/${id}`} className="flex items-center text-sm text-blue-600 mt-1">
              <Building className="w-4 h-4 mr-1" />
              <span>{project.name}</span>
            </Link>
          </div>
          
          <div className="mt-4 md:mt-0 md:ml-4">
            {bid.totalCost ? (
              <div className="md:text-right">
                <div className="text-sm text-gray-500">Total Bid Amount</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(bid.totalCost)}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Bid details */}
        <div className="md:col-span-2 space-y-6">
          {/* Cost breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">Cost Breakdown</h2>
            
            {bid.keyComponents ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-medium">Category</span>
                  <span className="font-medium">Amount</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Materials</span>
                  <span>{formatCurrency(bid.keyComponents.materials)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Labor</span>
                  <span>{formatCurrency(bid.keyComponents.labor)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overhead</span>
                  <span>{formatCurrency(bid.keyComponents.overhead)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t font-medium">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(bid.totalCost)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                {bid.status === 'analyzed' ? (
                  <p>No detailed cost breakdown available.</p>
                ) : (
                  <p>Analyze this bid to see cost breakdown.</p>
                )}
              </div>
            )}
          </div>
          
          {/* Analysis results */}
          {bid.status === 'analyzed' && bid.analysisResults && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Analysis Results</h2>
              
              {/* Risks section */}
              {bid.analysisResults.risks && bid.analysisResults.risks.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Risk Factors</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    {bid.analysisResults.risks.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Recommendations section */}
              {bid.analysisResults.recommendations && bid.analysisResults.recommendations.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Recommendations</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    {bid.analysisResults.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Right column - Actions and status */}
        <div className="space-y-6">
          {/* Bid status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">Bid Status</h2>
            
            <div className="flex items-center mb-4">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                bid.status === 'analyzed' 
                  ? 'bg-green-500' 
                  : bid.status === 'processing' 
                    ? 'bg-blue-500 animate-pulse' 
                    : 'bg-yellow-500'
              }`}></div>
              
              <span className="capitalize">{bid.status || 'pending'}</span>
            </div>
            
            {bid.status !== 'analyzed' && (
              <button
                onClick={() => setAnalyzeModalOpen(true)}
                className={`w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                  bid.status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={bid.status === 'processing'}
              >
                {bid.status === 'processing' ? 'Processing...' : 'Analyze Bid'}
              </button>
            )}
          </div>
          
          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">Actions</h2>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                <span>Download Original</span>
                <Download className="w-4 h-4" />
              </button>
              
              {bid.status === 'analyzed' && (
                <Link
                  href={`/projects/${id}/compare?bids=${bidId}`}
                  className="w-full flex items-center justify-between py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <span>Compare With Others</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Analyze Modal */}
      {analyzeModalOpen && (
        <AnalyzeModal 
          isOpen={analyzeModalOpen}
          onClose={handleAnalysisComplete}
          bid={bid}
          projectId={id}
        />
      )}
    </div>
  );
}