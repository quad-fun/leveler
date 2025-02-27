'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function BidComparisonChart({ bids }) {
  // Format currency for labels
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare data for the chart
  const data = {
    labels: bids.map(bid => bid.bidder),
    datasets: [
      {
        label: 'Total Cost',
        data: bids.map(bid => bid.totalCost),
        backgroundColor: 'rgba(59, 130, 246, 0.5)', // blue-500 with opacity
        borderColor: 'rgb(59, 130, 246)', // blue-500
        borderWidth: 1,
      },
      {
        label: 'Materials',
        data: bids.map(bid => bid.keyComponents?.materials || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.5)', // green-500 with opacity
        borderColor: 'rgb(16, 185, 129)', // green-500
        borderWidth: 1,
      },
      {
        label: 'Labor',
        data: bids.map(bid => bid.keyComponents?.labor || 0),
        backgroundColor: 'rgba(245, 158, 11, 0.5)', // amber-500 with opacity
        borderColor: 'rgb(245, 158, 11)', // amber-500
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Bid Cost Breakdown'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  return (
    <div className="p-6">
      <div className="h-[400px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
} 