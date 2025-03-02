import puppeteer from 'puppeteer';

const FORCE_MOCK_DATA = false; 

export async function POST(request) {
  try {
    const results = await request.json();

    // Create HTML content for the PDF
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #2563eb; }
            h2 { color: #1e40af; margin-top: 30px; }
            .section { margin: 20px 0; }
            .recommendation { background: #f3f4f6; padding: 10px; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Bid Analysis Report</h1>
          
          <div class="section">
            <h2>Summary</h2>
            <p><strong>Recommended Bid:</strong> ${results.summary.recommendedBid}</p>
            <p><strong>Total Cost:</strong> $${results.summary.totalCost?.toLocaleString()}</p>
            <p><strong>Reasoning:</strong> ${results.summary.reasoning}</p>
          </div>

          <div class="section">
            <h2>Cost Analysis</h2>
            <table>
              <tr>
                <th>Bidder</th>
                <th>Total Cost</th>
                <th>Materials</th>
                <th>Labor</th>
                <th>Overhead</th>
              </tr>
              ${results.bidComparison.map(bid => `
                <tr>
                  <td>${bid.bidder}</td>
                  <td>$${bid.totalCost?.toLocaleString()}</td>
                  <td>$${bid.keyComponents?.materials?.toLocaleString() || 'N/A'}</td>
                  <td>$${bid.keyComponents?.labor?.toLocaleString() || 'N/A'}</td>
                  <td>$${bid.keyComponents?.overhead?.toLocaleString() || 'N/A'}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <h2>Risk Assessment</h2>
            <h3>Risk Factors:</h3>
            <ul>
              ${results.risks.map(factor => `
                <li>${factor}</li>
              `).join('')}
            </ul>
          </div>

          <div class="section">
            <h2>Recommendations</h2>
            ${results.recommendations.map(rec => `
              <div class="recommendation">${rec}</div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new'
    });
    const page = await browser.newPage();
    await page.setContent(html);
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '40px',
        right: '40px',
        bottom: '40px',
        left: '40px'
      }
    });

    await browser.close();

    // Send PDF
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=bid-analysis.pdf'
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}