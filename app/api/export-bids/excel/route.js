import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(request) {
  try {
    const results = await request.json();
    
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bid Analysis Report');
    
    // Style configurations
    const headerStyle = {
      font: { bold: true, color: { argb: 'FF2563EB' }, size: 14 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
    };
    
    // Summary Section
    worksheet.addRow(['Bid Analysis Report']).font = { bold: true, size: 16 };
    worksheet.addRow([]);
    
    worksheet.addRow(['Summary']).font = { bold: true, size: 14 };
    worksheet.addRow(['Recommended Bid', results.summary.recommendedBid]);
    worksheet.addRow(['Total Cost', `$${results.summary.totalCost?.toLocaleString()}`]);
    worksheet.addRow(['Reasoning', results.summary.reasoning]);
    worksheet.addRow([]);
    
    // Cost Analysis Section
    worksheet.addRow(['Cost Analysis']).font = { bold: true, size: 14 };
    worksheet.addRow([]);
    
    // Add cost comparison table
    const costHeaders = ['Bidder', 'Total Cost', 'Materials', 'Labor', 'Overhead'];
    worksheet.addRow(costHeaders).eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    });
    
    results.bidComparison.forEach(bid => {
      worksheet.addRow([
        bid.bidder,
        `$${bid.totalCost?.toLocaleString() || 'N/A'}`,
        `$${bid.keyComponents?.materials?.toLocaleString() || 'N/A'}`,
        `$${bid.keyComponents?.labor?.toLocaleString() || 'N/A'}`,
        `$${bid.keyComponents?.overhead?.toLocaleString() || 'N/A'}`
      ]);
    });
    worksheet.addRow([]);
    
    // Risk Assessment Section
    worksheet.addRow(['Risk Assessment']).font = { bold: true, size: 14 };
    worksheet.addRow(['Risk Factors:']);
    results.risks.forEach(risk => {
      worksheet.addRow([risk]);
    });
    worksheet.addRow([]);
    
    // Recommendations Section
    worksheet.addRow(['Recommendations']).font = { bold: true, size: 14 };
    results.recommendations.forEach(rec => {
      worksheet.addRow([rec]);
    });
    
    // Format columns
    worksheet.columns.forEach(column => {
      column.width = 30;
    });
    
    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=bid-analysis.xlsx'
      }
    });
  } catch (error) {
    console.error('Excel generation error:', error);
    return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
  }
} 