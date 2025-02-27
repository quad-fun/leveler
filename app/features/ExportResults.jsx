'use client';

import React from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';

const ExportResults = ({ results }) => {
  const exportToExcel = async () => {
    try {
      const response = await fetch('/api/export-bids/excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(results),
      });

      if (!response.ok) throw new Error('Excel generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bid-analysis.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Export function is currently unavailable. Please try again later.');
    }
  };

  const exportToPDF = async () => {
    try {
      const response = await fetch('/api/export-bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(results),
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bid-analysis.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Export function is currently unavailable. Please try again later.');
    }
  };

  return (
    <div className="mt-6 flex space-x-4">
      <button
        onClick={exportToExcel}
        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Export to Excel
      </button>
      
      <button
        onClick={exportToPDF}
        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        <FileText className="w-4 h-4 mr-2" />
        Export to PDF
      </button>
    </div>
  );
};

export default ExportResults;