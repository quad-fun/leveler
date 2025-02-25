'use client';

import React, { useEffect, useState } from 'react';

export default function TokenUsageMonitor() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('day'); // day, week, month, all

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate date range based on selected timeRange
      let startDate = null;
      const now = new Date();
      
      if (timeRange === 'day') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
      } else if (timeRange === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
      }
      
      // Build query params
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      
      // Mock data for development
      // In production, this would be a real API call:
      // const response = await fetch(`/api/token-usage?${params.toString()}`);
      // if (!response.ok) {
      //   throw new Error('Failed to fetch token usage statistics');
      // }
      // const data = await response.json();
      
      // Simulate API call
      setTimeout(() => {
        const mockData = {
          totalTokens: 248500,
          totalInputTokens: 168300,
          totalOutputTokens: 80200,
          requestCount: 12,
          averagePerRequest: 20708,
          successRate: 91.7,
          estimatedCost: {
            formatted: '$4.82'
          },
          timeRange: {
            from: startDate ? startDate.toISOString() : 'all time',
            to: 'present'
          }
        };
        
        setStats(mockData);
        setLoading(false);
      }, 800);
      
    } catch (err) {
      console.error('Error fetching token stats:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Token Usage Monitor</h1>
      
      <div className="mb-6">
        <div className="flex space-x-2">
          <button 
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 rounded ${timeRange === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Last 24 Hours
          </button>
          <button 
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Last 30 Days
          </button>
          <button 
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 rounded ${timeRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            All Time
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded text-red-700">
          {error}
        </div>
      ) : stats ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-700">Total Tokens</h3>
              <p className="text-3xl font-bold">{stats.totalTokens.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Input: {stats.totalInputTokens.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Output: {stats.totalOutputTokens.toLocaleString()}</p>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-700">Estimated Cost</h3>
              <p className="text-3xl font-bold">{stats.estimatedCost?.formatted || '$0.00'}</p>
              <p className="text-sm text-gray-500">Based on current GPT-4 pricing</p>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-700">Request Count</h3>
              <p className="text-3xl font-bold">{stats.requestCount}</p>
              <p className="text-sm text-gray-500">Success Rate: {stats.successRate.toFixed(1)}%</p>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium text-gray-700">Avg. Per Request</h3>
              <p className="text-3xl font-bold">{Math.round(stats.averagePerRequest).toLocaleString()}</p>
              <p className="text-sm text-gray-500">tokens per request</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-medium mb-4">Token Usage Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Time Range</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {stats.timeRange.from === 'all time' 
                        ? 'All time' 
                        : `${new Date(stats.timeRange.from).toLocaleDateString()} to Present`}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total Input Tokens</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{stats.totalInputTokens.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total Output Tokens</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{stats.totalOutputTokens.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Input:Output Ratio</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {stats.totalOutputTokens > 0 
                        ? (stats.totalInputTokens / stats.totalOutputTokens).toFixed(2) 
                        : 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Successful Requests</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {Math.round(stats.requestCount * (stats.successRate / 100))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Data
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded text-yellow-700">
          No token usage data available.
        </div>
      )}
    </div>
  );
}