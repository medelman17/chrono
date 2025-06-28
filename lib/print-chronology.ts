import { ChronologyEntry } from "@/types/chronology";

export interface PrintOptions {
  caseTitle?: string;
  caseNumber?: string;
  preparedFor?: string;
  preparedBy?: string;
  includePageNumbers?: boolean;
  includeTableOfContents?: boolean;
  fontSize?: "small" | "medium" | "large";
  paperSize?: "letter" | "legal";
  margins?: "narrow" | "normal" | "wide";
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

export function generatePrintHTML(
  entries: ChronologyEntry[],
  caseContext: string,
  keyParties: string,
  options: PrintOptions = {}
): string {
  const {
    caseTitle = "Litigation Chronology",
    caseNumber = "",
    preparedFor = "",
    preparedBy = "",
    includePageNumbers = true,
    includeTableOfContents = false,
    fontSize = "medium",
    paperSize = "letter",
    margins = "normal",
  } = options;

  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = new Date(a.date + " " + (a.time || "00:00"));
    const dateB = new Date(b.date + " " + (b.time || "00:00"));
    return dateA.getTime() - dateB.getTime();
  });

  const marginSizes = {
    narrow: "0.5in",
    normal: "1in",
    wide: "1.5in",
  };

  const fontSizes = {
    small: "11px",
    medium: "12px",
    large: "14px",
  };

  const pageHeight = paperSize === "legal" ? "14in" : "11in";

  const printCSS = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      @page {
        size: 8.5in ${pageHeight};
        margin: ${marginSizes[margins]};
      }

      * {
        box-sizing: border-box;
      }

      @media print {
        body {
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          font-size: ${fontSizes[fontSize]};
          line-height: 1.6;
          color: #111827;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .no-print {
          display: none !important;
        }

        .page-break {
          page-break-after: always;
        }

        .avoid-break {
          page-break-inside: avoid;
        }

        .content {
          max-width: 100%;
        }

        /* Modern entry styling */
        .entry {
          margin-bottom: 2em;
          page-break-inside: avoid;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5em;
          background: #ffffff;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1em;
          padding-bottom: 0.75em;
          border-bottom: 2px solid #f3f4f6;
        }

        .entry-date-group {
          display: flex;
          align-items: center;
          gap: 1em;
        }

        .entry-date {
          font-weight: 600;
          color: #1f2937;
          font-size: 1.1em;
        }

        .entry-time {
          color: #6b7280;
          font-size: 0.95em;
        }

        .entry-category {
          display: inline-block;
          padding: 0.25em 0.75em;
          background-color: #dbeafe;
          color: #1e40af;
          font-size: 0.85em;
          font-weight: 500;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .entry-title {
          font-size: 1.25em;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.75em;
          line-height: 1.4;
        }

        .entry-parties {
          display: flex;
          align-items: center;
          gap: 0.5em;
          margin-bottom: 1em;
          color: #6b7280;
          font-size: 0.95em;
        }

        .entry-parties::before {
          content: "👥";
          font-size: 1.1em;
        }

        .entry-summary {
          color: #374151;
          margin-bottom: 1em;
          line-height: 1.7;
        }

        .entry-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5em;
          margin-top: 1.25em;
          padding-top: 1em;
          border-top: 1px solid #f3f4f6;
        }

        .entry-metadata {
          display: flex;
          align-items: center;
          gap: 0.4em;
          font-size: 0.875em;
          color: #6b7280;
        }

        .entry-metadata-icon {
          width: 16px;
          height: 16px;
        }

        .legal-significance {
          margin-top: 1em;
          padding: 1em;
          background-color: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          font-size: 0.95em;
        }

        .legal-significance-header {
          font-weight: 600;
          color: #92400e;
          margin-bottom: 0.5em;
          display: flex;
          align-items: center;
          gap: 0.5em;
        }

        .legal-significance-content {
          color: #78350f;
          line-height: 1.6;
        }

        /* Table of Contents styling */
        .toc {
          page-break-after: always;
        }

        .toc-entry {
          display: flex;
          align-items: baseline;
          margin-bottom: 0.75em;
          font-size: 0.95em;
        }

        .toc-number {
          font-weight: 600;
          color: #6b7280;
          margin-right: 1em;
          min-width: 2em;
        }

        .toc-content {
          flex: 1;
          display: flex;
          align-items: baseline;
        }

        .toc-title {
          color: #374151;
        }

        .toc-dots {
          flex: 1;
          border-bottom: 1px dotted #d1d5db;
          margin: 0 0.5em;
          min-width: 2em;
        }

        .toc-page {
          color: #6b7280;
          font-weight: 500;
        }

        /* Cover page styling */
        .cover-title {
          font-size: 2.5em;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5em;
          letter-spacing: -0.025em;
        }

        .cover-subtitle {
          font-size: 1.5em;
          font-weight: 400;
          color: #6b7280;
          margin-bottom: 2em;
        }

        .cover-section {
          margin: 3em 0;
        }

        .cover-label {
          font-size: 0.875em;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5em;
        }

        .cover-value {
          font-size: 1.125em;
          color: #111827;
          font-weight: 500;
        }

        /* Case context styling */
        .context-section {
          margin-bottom: 2em;
        }

        .context-heading {
          font-size: 1.25em;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.75em;
          display: flex;
          align-items: center;
          gap: 0.5em;
        }

        .context-content {
          color: #374151;
          line-height: 1.7;
        }

        .section-title {
          font-size: 2em;
          font-weight: 700;
          color: #111827;
          text-align: center;
          margin-bottom: 2em;
          letter-spacing: -0.025em;
        }
      }

      /* Screen preview styles */
      @media screen {
        body {
          background: #f3f4f6;
          margin: 0;
          padding: 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .page {
          background: white;
          margin: 0 auto 20px;
          padding: ${marginSizes[margins]};
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          width: 8.5in;
          min-height: ${pageHeight};
          box-sizing: border-box;
        }

        .print-controls {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 1000;
          display: flex;
          gap: 12px;
        }

        .print-button {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .print-button:hover {
          background: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .close-button {
          background: #f3f4f6;
          color: #374151;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          font-family: inherit;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #e5e7eb;
          transform: translateY(-1px);
        }

        /* Copy all print styles to screen for preview */
        .content { max-width: 100%; }
        .entry {
          margin-bottom: 2em;
          page-break-inside: avoid;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5em;
          background: #ffffff;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1em;
          padding-bottom: 0.75em;
          border-bottom: 2px solid #f3f4f6;
        }
        .entry-date-group {
          display: flex;
          align-items: center;
          gap: 1em;
        }
        .entry-date {
          font-weight: 600;
          color: #1f2937;
          font-size: 1.1em;
        }
        .entry-time {
          color: #6b7280;
          font-size: 0.95em;
        }
        .entry-category {
          display: inline-block;
          padding: 0.25em 0.75em;
          background-color: #dbeafe;
          color: #1e40af;
          font-size: 0.85em;
          font-weight: 500;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        .entry-title {
          font-size: 1.25em;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.75em;
          line-height: 1.4;
        }
        .entry-parties {
          display: flex;
          align-items: center;
          gap: 0.5em;
          margin-bottom: 1em;
          color: #6b7280;
          font-size: 0.95em;
        }
        .entry-parties::before {
          content: "👥";
          font-size: 1.1em;
        }
        .entry-summary {
          color: #374151;
          margin-bottom: 1em;
          line-height: 1.7;
        }
        .entry-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5em;
          margin-top: 1.25em;
          padding-top: 1em;
          border-top: 1px solid #f3f4f6;
        }
        .entry-metadata {
          display: flex;
          align-items: center;
          gap: 0.4em;
          font-size: 0.875em;
          color: #6b7280;
        }
        .legal-significance {
          margin-top: 1em;
          padding: 1em;
          background-color: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          font-size: 0.95em;
        }
        .legal-significance-header {
          font-weight: 600;
          color: #92400e;
          margin-bottom: 0.5em;
          display: flex;
          align-items: center;
          gap: 0.5em;
        }
        .legal-significance-content {
          color: #78350f;
          line-height: 1.6;
        }
        .toc-entry {
          display: flex;
          align-items: baseline;
          margin-bottom: 0.75em;
          font-size: 0.95em;
        }
        .toc-number {
          font-weight: 600;
          color: #6b7280;
          margin-right: 1em;
          min-width: 2em;
        }
        .toc-content {
          flex: 1;
          display: flex;
          align-items: baseline;
        }
        .toc-title {
          color: #374151;
        }
        .toc-dots {
          flex: 1;
          border-bottom: 1px dotted #d1d5db;
          margin: 0 0.5em;
          min-width: 2em;
        }
        .toc-page {
          color: #6b7280;
          font-weight: 500;
        }
        .cover-title {
          font-size: 2.5em;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5em;
          letter-spacing: -0.025em;
        }
        .cover-subtitle {
          font-size: 1.5em;
          font-weight: 400;
          color: #6b7280;
          margin-bottom: 2em;
        }
        .cover-section {
          margin: 3em 0;
        }
        .cover-label {
          font-size: 0.875em;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5em;
        }
        .cover-value {
          font-size: 1.125em;
          color: #111827;
          font-weight: 500;
        }
        .context-section {
          margin-bottom: 2em;
        }
        .context-heading {
          font-size: 1.25em;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.75em;
          display: flex;
          align-items: center;
          gap: 0.5em;
        }
        .context-content {
          color: #374151;
          line-height: 1.7;
        }
        .section-title {
          font-size: 2em;
          font-weight: 700;
          color: #111827;
          text-align: center;
          margin-bottom: 2em;
          letter-spacing: -0.025em;
        }
      }
    </style>
  `;

  const coverPage = `
    <div class="page">
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center;">
        <h1 class="cover-title">${caseTitle}</h1>
        ${caseNumber ? `<h2 class="cover-subtitle">Case No. ${caseNumber}</h2>` : ""}
        
        <div class="cover-section">
          <h3 style="font-size: 1.75em; font-weight: 300; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase;">Chronology of Events</h3>
        </div>
        
        <div style="margin-top: auto;">
          ${preparedFor ? `<div class="cover-section">
            <p class="cover-label">Prepared for</p>
            <p class="cover-value">${preparedFor}</p>
          </div>` : ""}
          
          ${preparedBy ? `<div class="cover-section">
            <p class="cover-label">Prepared by</p>
            <p class="cover-value">${preparedBy}</p>
          </div>` : ""}
          
          <div class="cover-section">
            <p class="cover-label">Date</p>
            <p class="cover-value">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const tocPage = includeTableOfContents ? `
    <div class="page toc">
      <h2 class="section-title">Table of Contents</h2>
      <div>
        ${sortedEntries
          .map(
            (entry, index) => `
          <div class="toc-entry">
            <span class="toc-number">${index + 1}.</span>
            <div class="toc-content">
              <span class="toc-title">${formatDate(entry.date)} - ${entry.title.substring(0, 60)}${entry.title.length > 60 ? "..." : ""}</span>
              <span class="toc-dots"></span>
              <span class="toc-page">${Math.floor(index / 3) + 3}</span>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  ` : "";

  const contextPage = caseContext || keyParties ? `
    <div class="page">
      <h2 class="section-title">Case Context</h2>
      
      ${caseContext ? `
        <div class="context-section">
          <h3 class="context-heading">📋 Overview</h3>
          <div class="context-content">${caseContext.split('\n').map(p => `<p>${p}</p>`).join('')}</div>
        </div>
      ` : ""}
      
      ${keyParties ? `
        <div class="context-section">
          <h3 class="context-heading">👥 Key Parties</h3>
          <div class="context-content">${keyParties.split('\n').map(p => `<p>${p}</p>`).join('')}</div>
        </div>
      ` : ""}
    </div>
  ` : "";

  const entriesHTML = sortedEntries
    .map(
      (entry, index) => `
    <div class="entry ${index > 0 && index % 3 === 0 ? "page-break" : "avoid-break"}">
      <div class="entry-header">
        <div class="entry-date-group">
          <span class="entry-date">${formatDate(entry.date)}</span>
          ${entry.time ? `<span class="entry-time">${entry.time}</span>` : ""}
        </div>
        ${entry.category ? `<span class="entry-category">${entry.category}</span>` : ""}
      </div>
      
      <div class="entry-title">${escapeHtml(entry.title)}</div>
      
      ${entry.parties ? `<div class="entry-parties">${escapeHtml(entry.parties)}</div>` : ""}
      
      <div class="entry-summary">${escapeHtml(entry.summary)}</div>
      
      ${entry.legalSignificance ? `
        <div class="legal-significance">
          <div class="legal-significance-header">⚖️ Legal Significance</div>
          <div class="legal-significance-content">${escapeHtml(entry.legalSignificance)}</div>
        </div>
      ` : ""}
      
      <div class="entry-footer">
        ${entry.source ? `
          <div class="entry-metadata">
            <svg class="entry-metadata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>Source: ${escapeHtml(entry.source)}</span>
          </div>
        ` : ""}
        
        ${entry.relatedEntries ? `
          <div class="entry-metadata">
            <svg class="entry-metadata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            <span>Related: ${escapeHtml(entry.relatedEntries)}</span>
          </div>
        ` : ""}
        
        ${entry.documents && entry.documents.length > 0 ? `
          <div class="entry-metadata">
            <svg class="entry-metadata-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
            <span>Documents: ${entry.documents.map(d => d.filename).join(", ")}</span>
          </div>
        ` : ""}
      </div>
    </div>
  `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${caseTitle} - Chronology</title>
        ${printCSS}
      </head>
      <body>
        <div class="print-controls no-print">
          <button class="print-button" onclick="window.print()">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
            </svg>
            Print
          </button>
          <button class="close-button" onclick="window.close()">Close</button>
        </div>
        
        ${coverPage}
        ${tocPage}
        ${contextPage}
        
        <div class="page">
          <div class="content">
            <h2 class="section-title">Chronology</h2>
            ${entriesHTML}
          </div>
        </div>
        
        <script>
          // Auto-show print dialog after a short delay
          setTimeout(() => {
            // window.print();
          }, 500);
        </script>
      </body>
    </html>
  `;

  return html;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}