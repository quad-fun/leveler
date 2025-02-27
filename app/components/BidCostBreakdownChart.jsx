'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function BidCostBreakdownChart({ bid }) {
  // Format currency for labels
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate percentages for labels
  const calculatePercentage = (value) => {
    return ((value / bid.totalCost) * 100).toFixed(1);
  };

  const data = {
    labels: ['Materials', 'Labor', 'Overhead'],
    datasets: [{
      data: [
        bid.keyComponents?.materials || 0,
        bid.keyComponents?.labor || 0,
        bid.keyComponents?.overhead || 0
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)', // green-500
        'rgba(245, 158, 11, 0.8)', // amber-500
        'rgba(99, 102, 241, 0.8)'  // indigo-500
      ],
      borderColor: [
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(99, 102, 241)'
      ],
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label, i) => {
              const value = datasets[0].data[i];
              const percentage = calculatePercentage(value);
              return {
                text: `${label} (${formatCurrency(value)} - ${percentage}%)`,
                fillStyle: datasets[0].backgroundColor[i],
                strokeStyle: datasets[0].borderColor[i],
                lineWidth: 1,
                hidden: false,
                index: i
              };
            });
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const percentage = calculatePercentage(value);
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  // Add center text plugin
  const centerText = {
    id: 'centerText',
    beforeDraw: function(chart) {
      const width = chart.width;
      const height = chart.height;
      const ctx = chart.ctx;
      
      ctx.restore();
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#6B7280'; // text-gray-500
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      const text = 'Total Cost';
      const textX = width / 2;
      const textY = height / 2 - 10;
      
      ctx.fillText(text, textX, textY);
      
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#059669'; // text-green-600
      const value = formatCurrency(bid.totalCost);
      ctx.fillText(value, textX, textY + 25);
      
      ctx.save();
    }
  };

  return (
    <div className="h-[300px] relative">
      <Doughnut 
        data={data} 
        options={options}
        plugins={[centerText]}
      />
    </div>
  );
} 