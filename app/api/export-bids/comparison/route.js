import ExcelJS from 'exceljs';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Create workbook and worksheets
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bid Leveling Assistant';
    workbook.created = new Date();
    
    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    configureSummarySheet(summarySheet, data);
    
    // Cost Comparison Sheet
    const costsSheet = workbook.addWorksheet('Cost Comparison');
    configureCostComparisonSheet(costsSheet, data.bidComparison);
    
    // Risk Analysis Sheet
    const riskSheet = workbook.addWorksheet('Risk Analysis');
    configureRiskAnalysisSheet(riskSheet, data.risks);
    
    // Recommendations Sheet
    const recsSheet = workbook.addWorksheet('Recommendations');
    configureRecommendationsSheet(recsSheet, data.recommendations);
    
    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Return as Excel file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=bid-comparison.xlsx'
      }
    });
  } catch (error) {
    console.error('Excel comparison generation error:', error);
    return Response.json({ error: 'Failed to generate Excel comparison file' }, { status: 500 });
  }
}

function configureSummarySheet(sheet, data) {
  // Title
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Bid Comparison Summary';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  
  // Project details
  sheet.getCell('A3').value = 'Project:';
  sheet.getCell('B3').value = data.summary.projectName;
  sheet.getCell('B3').font = { bold: true };
  
  sheet.getCell('A4').value = 'Number of Bids Compared:';
  sheet.getCell('B4').value = data.summary.bidCount;
  
  sheet.getCell('A5').value = 'Comparison Date:';
  sheet.getCell('B5').value = new Date(data.summary.comparisonDate);
  sheet.getCell('B5').numFmt = 'yyyy-mm-dd';
  
  // Find lowest bid
  let lowestBid = null;
  let lowestCost = Infinity;
  
  data.bidComparison.forEach(bid => {
    if (bid.totalCost < lowestCost) {
      lowestCost = bid.totalCost;
      lowestBid = bid;
    }
  });
  
  if (lowestBid) {
    sheet.getCell('A7').value = 'Lowest Bid:';
    sheet.getCell('B7').value = lowestBid.bidder;
    sheet.getCell('B7').font = { bold: true };
    
    sheet.getCell('A8').value = 'Lowest Bid Amount:';
    sheet.getCell('B8').value = lowestBid.totalCost;
    sheet.getCell('B8').numFmt = '$#,##0.00';
    sheet.getCell('B8').font = { bold: true, color: { argb: 'FF008000' } };
  }
  
  // List of compared bids
  sheet.getCell('A10').value = 'Bids Included in Comparison:';
  sheet.getCell('A10').font = { bold: true };
  
  data.bidComparison.forEach((bid, index) => {
    const rowIndex = 11 + index;
    sheet.getCell(`A${rowIndex}`).value = bid.bidder;
    sheet.getCell(`B${rowIndex}`).value = bid.totalCost;
    sheet.getCell(`B${rowIndex}`).numFmt = '$#,##0.00';
  });
  
  // Set column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 30;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 15;
}

function configureCostComparisonSheet(sheet, bidComparison) {
  // Create header row with bidder names
  const headerRow = ['Category'];
  bidComparison.forEach(bid => {
    headerRow.push(bid.bidder);
  });
  
  sheet.addRow(headerRow);
  
  // Style header row
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
  });
  
  // Add total cost row
  const totalCostRow = ['Total Cost'];
  bidComparison.forEach(bid => {
    totalCostRow.push(bid.totalCost);
  });
  sheet.addRow(totalCostRow);
  
  // Add materials row
  const materialsRow = ['Materials'];
  bidComparison.forEach(bid => {
    materialsRow.push(bid.keyComponents?.materials || null);
  });
  sheet.addRow(materialsRow);
  
  // Add labor row
  const laborRow = ['Labor'];
  bidComparison.forEach(bid => {
    laborRow.push(bid.keyComponents?.labor || null);
  });
  sheet.addRow(laborRow);
  
  // Add overhead row
  const overheadRow = ['Overhead'];
  bidComparison.forEach(bid => {
    overheadRow.push(bid.keyComponents?.overhead || null);
  });
  sheet.addRow(overheadRow);
  
  // Add materials percentage row
  const materialsPctRow = ['Materials (% of Total)'];
  bidComparison.forEach(bid => {
    const materialsPercent = bid.keyComponents?.materials && bid.totalCost
      ? (bid.keyComponents.materials / bid.totalCost) * 100
      : null;
    materialsPctRow.push(materialsPercent);
  });
  sheet.addRow(materialsPctRow);
  
  // Add labor percentage row
  const laborPctRow = ['Labor (% of Total)'];
  bidComparison.forEach(bid => {
    const laborPercent = bid.keyComponents?.labor && bid.totalCost
      ? (bid.keyComponents.labor / bid.totalCost) * 100
      : null;
    laborPctRow.push(laborPercent);
  });
  sheet.addRow(laborPctRow);
  
  // Set format for all number cells
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    
    // First column is always text
    for (let j = 2; j <= bidComparison.length + 1; j++) {
      const cell = row.getCell(j);
      
      if (i >= 2 && i <= 5) {
        // Money format for cost rows
        cell.numFmt = '$#,##0.00';
      } else if (i >= 6 && i <= 7) {
        // Percentage format for percentage rows
        cell.numFmt = '0.0"%"';
      }
    }
  }
  
  // Highlight the lowest bid
  let lowestBidIndex = -1;
  let lowestCost = Infinity;
  
  bidComparison.forEach((bid, index) => {
    if (bid.totalCost < lowestCost) {
      lowestCost = bid.totalCost;
      lowestBidIndex = index;
    }
  });
  
  if (lowestBidIndex >= 0) {
    const totalCostRow = sheet.getRow(2);
    const cell = totalCostRow.getCell(lowestBidIndex + 2); // +2 because of the category column
    cell.font = { bold: true, color: { argb: 'FF008000' } };
  }
  
  // Auto-fit columns
  sheet.columns.forEach(column => {
    column.width = 20;
  });
}

function configureRiskAnalysisSheet(sheet, risks) {
  // Add title
  sheet.mergeCells('A1:C1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Risk Analysis by Bidder';
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  
  // Add headers
  sheet.addRow(['Bidder', 'Risk Factor']);
  
  const header = sheet.getRow(2);
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
  });
  
  // Add risk data
  risks.forEach(item => {
    sheet.addRow([item.bidder, item.risk]);
  });
  
  // Set column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 60;
}

function configureRecommendationsSheet(sheet, recommendations) {
  // Add title
  sheet.mergeCells('A1:C1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Recommendations by Bidder';
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  
  // Add headers
  sheet.addRow(['Bidder', 'Recommendation']);
  
  const header = sheet.getRow(2);
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
  });
  
  // Add recommendation data
  recommendations.forEach(item => {
    sheet.addRow([item.bidder, item.recommendation]);
  });
  
  // Set column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 60;
}