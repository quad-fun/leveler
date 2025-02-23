'use client';

import React from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import ExcelJS from 'exceljs';

const ExportResults = ({ results }) => {
  const exportToExcel = async () => {
    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRows([
      ['Bid Analysis Summary'],
      ['Recommended Bid', results.summary.recommendedBid],
      ['Reasoning', results.summary.reasoning],
      [''],
      ['Cost Comparison'],
      ['Bidder', 'Total Cost'],
      ...results.costAnalysis.bidComparison.map(bid => 
        [bid.bidder, bid.totalCost]
      )
    ]);

    // Risk Assessment Sheet
    const riskSheet = workbook.addWorksheet('Risk Assessment');
    riskSheet.addRows([
      ['Risk Assessment'],
      ['Risk Level', results.riskAssessment.level],
      [''],
      ['Risk Factors'],
      ...results.riskAssessment.factors.map(factor => [factor])
    ]);

    // Recommendations Sheet
    const recsSheet = workbook.addWorksheet('Recommendations');
    recsSheet.addRows([
      ['Recommendations'],
      ...results.recommendations.map(rec => [rec])
    ]);

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bid-analysis.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    try {
      const response = await fetch('/api/export-pdf', {
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