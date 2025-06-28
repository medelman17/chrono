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

        /* Compact entry styling for better scanning */
        .entry {
          margin-bottom: 0.75em;
          page-break-inside: avoid;
          padding: 0.5em 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .entry:last-child {
          border-bottom: none;
        }

        .entry-row {
          display: flex;
          gap: 1em;
          align-items: baseline;
        }

        .entry-date-col {
          flex-shrink: 0;
          width: 110px;
          font-weight: 600;
          color: #374151;
          font-size: 0.875em;
        }

        .entry-time {
          color: #6b7280;
          font-size: 0.75em;
          display: block;
        }

        .entry-content {
          flex: 1;
          min-width: 0;
        }

        .entry-header-line {
          display: flex;
          align-items: baseline;
          gap: 0.75em;
          margin-bottom: 0.25em;
        }

        .entry-title {
          font-weight: 600;
          color: #111827;
          font-size: 0.95em;
          line-height: 1.3;
          flex: 1;
        }

        .entry-category {
          flex-shrink: 0;
          font-size: 0.7em;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          padding: 0.15em 0.5em;
          background-color: #f3f4f6;
          border-radius: 4px;
        }

        .entry-parties {
          font-size: 0.8em;
          color: #6b7280;
          margin-bottom: 0.25em;
          font-style: italic;
        }

        .entry-summary {
          color: #374151;
          font-size: 0.875em;
          line-height: 1.4;
          margin-bottom: 0.25em;
        }

        .entry-metadata {
          display: flex;
          gap: 1em;
          font-size: 0.75em;
          color: #9ca3af;
          margin-top: 0.25em;
        }

        .metadata-item {
          display: flex;
          align-items: center;
          gap: 0.25em;
        }

        .legal-significance {
          margin-top: 0.5em;
          padding: 0.4em 0.6em;
          background-color: #fef3c7;
          border-left: 3px solid #f59e0b;
          font-size: 0.8em;
          line-height: 1.4;
        }

        .legal-significance-content {
          color: #92400e;
        }

        /* Category-specific colors */
        .entry-category.communication { background-color: #dbeafe; color: #1e40af; }
        .entry-category.financial { background-color: #d1fae5; color: #047857; }
        .entry-category.legal { background-color: #fce7f3; color: #be185d; }
        .entry-category.meeting { background-color: #e9d5ff; color: #7c3aed; }
        .entry-category.document { background-color: #fed7aa; color: #c2410c; }

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
          margin-bottom: 0.75em;
          page-break-inside: avoid;
          padding: 0.5em 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .entry:last-child {
          border-bottom: none;
        }
        .entry-row {
          display: flex;
          gap: 1em;
          align-items: baseline;
        }
        .entry-date-col {
          flex-shrink: 0;
          width: 110px;
          font-weight: 600;
          color: #374151;
          font-size: 0.875em;
        }
        .entry-time {
          color: #6b7280;
          font-size: 0.75em;
          display: block;
        }
        .entry-content {
          flex: 1;
          min-width: 0;
        }
        .entry-header-line {
          display: flex;
          align-items: baseline;
          gap: 0.75em;
          margin-bottom: 0.25em;
        }
        .entry-title {
          font-weight: 600;
          color: #111827;
          font-size: 0.95em;
          line-height: 1.3;
          flex: 1;
        }
        .entry-category {
          flex-shrink: 0;
          font-size: 0.7em;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          padding: 0.15em 0.5em;
          background-color: #f3f4f6;
          border-radius: 4px;
        }
        .entry-parties {
          font-size: 0.8em;
          color: #6b7280;
          margin-bottom: 0.25em;
          font-style: italic;
        }
        .entry-summary {
          color: #374151;
          font-size: 0.875em;
          line-height: 1.4;
          margin-bottom: 0.25em;
        }
        .entry-metadata {
          display: flex;
          gap: 1em;
          font-size: 0.75em;
          color: #9ca3af;
          margin-top: 0.25em;
        }
        .metadata-item {
          display: flex;
          align-items: center;
          gap: 0.25em;
        }
        .legal-significance {
          margin-top: 0.5em;
          padding: 0.4em 0.6em;
          background-color: #fef3c7;
          border-left: 3px solid #f59e0b;
          font-size: 0.8em;
          line-height: 1.4;
        }
        .legal-significance-content {
          color: #92400e;
        }
        /* Category-specific colors */
        .entry-category.communication { background-color: #dbeafe; color: #1e40af; }
        .entry-category.financial { background-color: #d1fae5; color: #047857; }
        .entry-category.legal { background-color: #fce7f3; color: #be185d; }
        .entry-category.meeting { background-color: #e9d5ff; color: #7c3aed; }
        .entry-category.document { background-color: #fed7aa; color: #c2410c; }
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

  // Helper to get category class
  const getCategoryClass = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'Communication': 'communication',
      'Financial Transaction': 'financial',
      'Legal Filing': 'legal',
      'Meeting/Conference': 'meeting',
      'Document Creation': 'document',
    };
    return categoryMap[category] || '';
  };

  const entriesHTML = sortedEntries
    .map(
      (entry, index) => `
    <div class="entry ${index > 0 && index % 10 === 0 ? "page-break" : ""}">
      <div class="entry-row">
        <div class="entry-date-col">
          ${formatDateCompact(entry.date)}
          ${entry.time ? `<span class="entry-time">${entry.time}</span>` : ""}
        </div>
        <div class="entry-content">
          <div class="entry-header-line">
            <div class="entry-title">${escapeHtml(entry.title)}</div>
            ${entry.category ? `<span class="entry-category ${getCategoryClass(entry.category)}">${entry.category}</span>` : ""}
          </div>
          
          ${entry.parties ? `<div class="entry-parties">${escapeHtml(entry.parties)}</div>` : ""}
          
          <div class="entry-summary">${escapeHtml(entry.summary)}</div>
          
          ${entry.legalSignificance ? `
            <div class="legal-significance">
              <div class="legal-significance-content">
                <strong>Legal:</strong> ${escapeHtml(entry.legalSignificance)}
              </div>
            </div>
          ` : ""}
          
          <div class="entry-metadata">
            ${entry.source ? `
              <div class="metadata-item">
                <span>Source: ${escapeHtml(entry.source)}</span>
              </div>
            ` : ""}
            
            ${entry.documents && entry.documents.length > 0 ? `
              <div class="metadata-item">
                <span>Docs: ${entry.documents.map(d => escapeHtml(d.filename)).join(", ")}</span>
              </div>
            ` : ""}
            
            ${entry.relatedEntries ? `
              <div class="metadata-item">
                <span>See: ${escapeHtml(entry.relatedEntries)}</span>
              </div>
            ` : ""}
          </div>
        </div>
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
    month: "short",
    day: "numeric",
  });
}

function formatDateCompact(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}