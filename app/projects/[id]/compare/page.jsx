// app/projects/[id]/compare/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Building, 
  Calendar, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  BarChart,
  AlertTriangle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function CompareBids({ params }) {
  const { id } = params;
  const searchParams = useSearchParams();
  
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Check if id exists
        if (!id) {
          throw new Error('No project ID provided');
        }
        
        const projectRes = await fetch(`/api/projects/${id}`);
        if (!projectRes.ok) throw new Error('Failed to fetch project');
        const projectData = await projectRes.json();
        setProject(projectData);

        const bidIds = searchParams.get('bids')?.split(',') || [];
        
        if (bidIds.length < 2) {
          throw new Error('At least two bids must be selected for comparison');
        }

        const bidsPromises = bidIds.map(bidId => 
          fetch(`/api/projects/${id}/bids/${bidId}`)
            .then(res => {
              if (!res.ok) throw new Error(`Failed to fetch bid ${bidId}`);
              return res.json();
            })
        );

        const bidsData = await Promise.all(bidsPromises);
        setBids(bidsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, searchParams]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    return `${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate the lowest bid to highlight it
  const lowestBid = bids.length 
    ? bids.reduce((prev, current) => 
        (prev.totalCost < current.totalCost) ? prev : current
      ) 
    : null;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-20 bg-red-50 rounded-lg">
          <h3 className="text-lg font-medium text-red-700">{error || 'Project not found'}</h3>
          <Link href={`/projects/${id}`} className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            Back to Project
          </Link>
        </div>
      </div>
    );
  }

  if (bids.length < 2) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-20 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-800">Not enough bids to compare</h3>
          <p className="text-yellow-700 mt-1">Please select at least two bids for comparison</p>
          <Link 
            href={`/projects/${id}`}
            className="mt-4 inline-block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Back to Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <Link href={`/projects/${id}`} className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Project
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold">Bid Comparison</h1>
        <p className="text-gray-600 mt-1">Comparing {bids.length} bids for {project.name}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Lowest Bid</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              ${lowestBid?.totalCost?.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-gray-900 mt-1">{lowestBid?.bidder}</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Average Bid</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              ${(bids.reduce((acc, bid) => acc + bid.totalCost, 0) / bids.length).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Across {bids.length} bids</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Bid Spread</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {((Math.max(...bids.map(b => b.totalCost)) - 
                Math.min(...bids.map(b => b.totalCost))) / 
                Math.min(...bids.map(b => b.totalCost)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">High-Low Variance</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-sm text-gray-500">Avg Materials %</div>
            <div className="text-lg font-semibold">
              {(bids.reduce((acc, bid) => 
                acc + (bid.keyComponents?.materials / bid.totalCost * 100 || 0), 0) / bids.length
              ).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Avg Labor %</div>
            <div className="text-lg font-semibold">
              {(bids.reduce((acc, bid) => 
                acc + (bid.keyComponents?.labor / bid.totalCost * 100 || 0), 0) / bids.length
              ).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Earliest Submission</div>
            <div className="text-lg font-semibold">
              {formatDate(Math.min(...bids.map(b => new Date(b.submittedAt))))}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Latest Submission</div>
            <div className="text-lg font-semibold">
              {formatDate(Math.max(...bids.map(b => new Date(b.submittedAt))))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comparison
                </th>
                {bids.map(bid => (
                  <th 
                    key={bid._id} 
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      bid._id === lowestBid?._id ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {bid.bidder}
                    {bid._id === lowestBid?._id && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Lowest
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Cost
                </td>
                {bids.map(bid => (
                  <td 
                    key={`${bid._id}-cost`} 
                    className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                      bid._id === lowestBid?._id ? 'text-green-600' : 'text-gray-900'
                    }`}
                  >
                    {formatCurrency(bid.totalCost)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Materials
                </td>
                {bids.map(bid => (
                  <td 
                    key={`${bid._id}-materials`} 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {formatCurrency(bid.keyComponents?.materials)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Labor
                </td>
                {bids.map(bid => (
                  <td 
                    key={`${bid._id}-labor`} 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {formatCurrency(bid.keyComponents?.labor)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Overhead
                </td>
                {bids.map(bid => (
                  <td 
                    key={`${bid._id}-overhead`} 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {formatCurrency(bid.keyComponents?.overhead)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Submitted Date
                </td>
                {bids.map(bid => (
                  <td 
                    key={`${bid._id}-date`} 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {formatDate(bid.submittedAt)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Actions
                </td>
                {bids.map(bid => (
                  <td 
                    key={`${bid._id}-actions`} 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    <Link
                      href={`/projects/${id}/bids/${bid._id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}