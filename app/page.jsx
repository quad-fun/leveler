'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  FileText, 
  TrendingUp, 
  BarChart4, 
  PlusCircle, 
  Clock, 
  BuildingIcon,
  ArrowRight,
  DollarSign,
  FileBarChart,
  UploadCloud
} from 'lucide-react';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeBids: 0,
    recentProjects: [],
    recentBids: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/dashboard-stats');
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Keep the sample data as fallback
        setTimeout(() => {
          setStats({
            totalProjects: 3,
            activeBids: 5,
            recentProjects: [
              {
                id: 'p1',
                name: 'Downtown Residential Tower',
                location: 'Downtown Metro',
                bidCount: 3,
                totalBudget: 85000000,
                updatedAt: '2025-02-20T14:30:00Z'
              },
              {
                id: 'p2',
                name: 'Westside Office Complex',
                location: 'West Business District',
                bidCount: 2,
                totalBudget: 56000000,
                updatedAt: '2025-02-18T09:15:00Z'
              }
            ],
            recentBids: [
              {
                id: 'b1',
                name: 'bid_sample_1.pdf',
                projectId: 'p1',
                projectName: 'Downtown Residential Tower',
                bidder: 'Quantum Urban Builders',
                totalCost: 82300000,
                submittedAt: '2025-02-20T09:30:00Z'
              },
              {
                id: 'b3',
                name: 'bid_sample_3.pdf',
                projectId: 'p1',
                projectName: 'Downtown Residential Tower',
                bidder: 'Sustainable Urban Solutions',
                totalCost: 88750000,
                submittedAt: '2025-02-19T11:45:00Z'
              },
              {
                id: 'b4',
                name: 'westside_bid1.pdf',
                projectId: 'p2',
                projectName: 'Westside Office Complex',
                bidder: 'Metro Commercial Builders',
                totalCost: 56000000,
                submittedAt: '2025-02-18T10:20:00Z'
              }
            ]
          });
          setLoading(false);
        }, 800);
      }
    };

    fetchDashboardStats();
  }, []);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">Welcome to your Bid Leveling Assistant</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link 
              href="/projects/new" 
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New Project
            </Link>
            <Link 
              href="/analyze" 
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Bid
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <FolderKanban className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Bids</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeBids}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Analyzed This Month</p>
                    <p className="text-2xl font-bold text-gray-900">5</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-full mr-4">
                    <BarChart4 className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Saved This Year</p>
                    <p className="text-2xl font-bold text-gray-900">$2.4M</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-200">
                <Link href="/projects/new" className="flex flex-col items-center p-6 hover:bg-blue-50">
                  <div className="bg-blue-100 p-3 rounded-full mb-3">
                    <BuildingIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-gray-900 font-medium">Create Project</span>
                </Link>
                
                <Link href="/analyze" className="flex flex-col items-center p-6 hover:bg-blue-50">
                  <div className="bg-green-100 p-3 rounded-full mb-3">
                    <UploadCloud className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-gray-900 font-medium">Upload Bid</span>
                </Link>
                
                <Link href="/projects" className="flex flex-col items-center p-6 hover:bg-blue-50">
                  <div className="bg-purple-100 p-3 rounded-full mb-3">
                    <FileBarChart className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-gray-900 font-medium">View Projects</span>
                </Link>
                
                <Link href="/admin/tokens" className="flex flex-col items-center p-6 hover:bg-blue-50">
                  <div className="bg-yellow-100 p-3 rounded-full mb-3">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                  <span className="text-gray-900 font-medium">Token Usage</span>
                </Link>
              </div>
            </div>
            
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Projects */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
                  <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    View All <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
                <div className="p-6">
                  {stats.recentProjects.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No projects yet</p>
                      <Link 
                        href="/projects/new" 
                        className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                      >
                        Create your first project
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.recentProjects.map((project) => (
                        <Link 
                          key={project.id} 
                          href={`/projects/${project.id}`}
                          className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{project.name}</h3>
                              <p className="text-sm text-gray-500">
                                {project.location} • {project.bidCount} {project.bidCount === 1 ? 'bid' : 'bids'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-green-600 font-medium">{formatCurrency(project.totalBudget)}</span>
                              <p className="text-xs text-gray-500">Updated {formatRelativeTime(project.updatedAt)}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recent Bids */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Recent Bids</h2>
                  <Link href="/bids" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    View All <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
                <div className="p-6">
                  {stats.recentBids.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No bids analyzed yet</p>
                      <Link 
                        href="/analyze" 
                        className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                      >
                        Upload your first bid
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.recentBids.map((bid) => (
                        <Link 
                          key={bid.id} 
                          href={`/projects/${bid.projectId}/bids/${bid.id}`}
                          className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <h3 className="font-medium text-gray-900">{bid.bidder}</h3>
                            <p className="text-xs text-gray-500">
                              {bid.projectName} • {formatDate(bid.submittedAt)}
                            </p>
                            <p className="mt-1 text-green-600 font-medium">
                              {formatCurrency(bid.totalCost)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}