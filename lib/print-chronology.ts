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
      @page {
        size: 8.5in ${pageHeight};
        margin: ${marginSizes[margins]};
      }

      @media print {
        body {
          margin: 0;
          font-family: "Times New Roman", Times, serif;
          font-size: ${fontSizes[fontSize]};
          line-height: 1.6;
          color: #000;
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

        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 0.5in;
          font-size: 10px;
          text-align: center;
          color: #666;
          border-bottom: 1px solid #ccc;
          padding: 10px 0;
        }

        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 0.5in;
          font-size: 10px;
          text-align: center;
          color: #666;
          border-top: 1px solid #ccc;
          padding: 10px 0;
        }

        .content {
          margin-top: 0.75in;
          margin-bottom: 0.75in;
        }

        .entry {
          margin-bottom: 1.5em;
          page-break-inside: avoid;
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5em;
          font-weight: bold;
        }

        .entry-date {
          color: #333;
        }

        .entry-category {
          color: #666;
          font-size: 0.9em;
          font-style: italic;
        }

        .entry-title {
          font-weight: bold;
          margin-bottom: 0.25em;
        }

        .entry-parties {
          font-style: italic;
          color: #444;
          margin-bottom: 0.25em;
          font-size: 0.95em;
        }

        .entry-summary {
          text-align: justify;
          margin-bottom: 0.5em;
        }

        .entry-metadata {
          font-size: 0.9em;
          color: #666;
          margin-top: 0.5em;
        }

        .legal-significance {
          margin-top: 0.5em;
          padding: 0.5em;
          background-color: #f0f0f0;
          border-left: 3px solid #666;
          font-size: 0.95em;
        }

        .toc {
          page-break-after: always;
        }

        .toc-entry {
          margin-bottom: 0.5em;
          display: flex;
          justify-content: space-between;
        }

        .toc-dots {
          flex: 1;
          border-bottom: 1px dotted #999;
          margin: 0 0.5em;
          position: relative;
          top: -0.3em;
        }
      }

      /* Screen preview styles */
      @media screen {
        body {
          background: #e5e5e5;
          margin: 0;
          padding: 20px;
          font-family: "Times New Roman", Times, serif;
        }

        .page {
          background: white;
          margin: 0 auto 20px;
          padding: ${marginSizes[margins]};
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          width: 8.5in;
          min-height: ${pageHeight};
          box-sizing: border-box;
        }

        .print-controls {
          position: fixed;
          top: 10px;
          right: 10px;
          background: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          z-index: 1000;
        }

        .print-button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin-right: 10px;
        }

        .print-button:hover {
          background: #1d4ed8;
        }

        .close-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }

        .close-button:hover {
          background: #4b5563;
        }
      }
    </style>
  `;

  const coverPage = `
    <div class="page">
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center;">
        <h1 style="font-size: 24px; margin-bottom: 2em;">${caseTitle}</h1>
        ${caseNumber ? `<h2 style="font-size: 18px; margin-bottom: 1em;">Case No. ${caseNumber}</h2>` : ""}
        
        <div style="margin-top: 4em;">
          <h3 style="font-size: 16px; margin-bottom: 3em;">CHRONOLOGY OF EVENTS</h3>
        </div>
        
        ${preparedFor ? `<div style="margin-top: auto; margin-bottom: 2em;">
          <p style="margin-bottom: 0.5em;"><strong>Prepared for:</strong></p>
          <p>${preparedFor}</p>
        </div>` : ""}
        
        ${preparedBy ? `<div style="margin-bottom: 2em;">
          <p style="margin-bottom: 0.5em;"><strong>Prepared by:</strong></p>
          <p>${preparedBy}</p>
        </div>` : ""}
        
        <div style="margin-bottom: 2em;">
          <p>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>
    </div>
  `;

  const tocPage = includeTableOfContents ? `
    <div class="page toc">
      <h2 style="text-align: center; margin-bottom: 2em;">TABLE OF CONTENTS</h2>
      <div>
        ${sortedEntries
          .map(
            (entry, index) => `
          <div class="toc-entry">
            <span>${entry.date} - ${entry.title.substring(0, 50)}${entry.title.length > 50 ? "..." : ""}</span>
            <span class="toc-dots"></span>
            <span>${index + 1}</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  ` : "";

  const contextPage = caseContext || keyParties ? `
    <div class="page">
      <h2 style="text-align: center; margin-bottom: 2em;">CASE CONTEXT</h2>
      
      ${caseContext ? `
        <div style="margin-bottom: 2em;">
          <h3 style="margin-bottom: 1em;">Overview</h3>
          <p style="text-align: justify;">${caseContext.replace(/\n/g, "</p><p style='text-align: justify;'>")}</p>
        </div>
      ` : ""}
      
      ${keyParties ? `
        <div>
          <h3 style="margin-bottom: 1em;">Key Parties</h3>
          <p style="text-align: justify;">${keyParties.replace(/\n/g, "</p><p style='text-align: justify;'>")}</p>
        </div>
      ` : ""}
    </div>
  ` : "";

  const entriesHTML = sortedEntries
    .map(
      (entry, index) => `
    <div class="entry ${index > 0 && index % 3 === 0 ? "page-break" : "avoid-break"}">
      <div class="entry-header">
        <span class="entry-date">${formatDate(entry.date)}${entry.time ? ` at ${entry.time}` : ""}</span>
        ${entry.category ? `<span class="entry-category">${entry.category}</span>` : ""}
      </div>
      
      <div class="entry-title">${entry.title}</div>
      
      ${entry.parties ? `<div class="entry-parties">Parties: ${entry.parties}</div>` : ""}
      
      <div class="entry-summary">${entry.summary}</div>
      
      ${entry.legalSignificance ? `
        <div class="legal-significance">
          <strong>Legal Significance:</strong> ${entry.legalSignificance}
        </div>
      ` : ""}
      
      <div class="entry-metadata">
        ${entry.source ? `Source: ${entry.source}` : ""}
        ${entry.source && entry.relatedEntries ? " | " : ""}
        ${entry.relatedEntries ? `Related: ${entry.relatedEntries}` : ""}
        ${entry.documents && entry.documents.length > 0 ? 
          ` | Documents: ${entry.documents.map(d => d.filename).join(", ")}` : ""}
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
          <button class="print-button" onclick="window.print()">Print</button>
          <button class="close-button" onclick="window.close()">Close</button>
        </div>
        
        ${coverPage}
        ${tocPage}
        ${contextPage}
        
        <div class="page">
          <div class="content">
            <h2 style="text-align: center; margin-bottom: 2em;">CHRONOLOGY</h2>
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