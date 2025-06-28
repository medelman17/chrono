# Printing Documentation

## Overview

Chrono's printing system provides a web-based print preview and customization interface for generating professional litigation chronologies. The system uses modern web technologies to create print-ready documents directly in the browser.

## Current Implementation

### Architecture

```
┌─────────────────────────┐
│  LitigationChronology   │
│      Manager.tsx        │
│  (Print Preview Button) │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   PrintSettingsModal    │
│  (Customization UI)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   generatePrintHTML()   │
│  (HTML Generation)      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│    New Browser Window   │
│   (Print Preview)       │
└─────────────────────────┘
```

### Key Components

1. **`/lib/print-chronology.ts`**
   - Core print HTML generation logic
   - CSS for print and screen media
   - Layout templates for cover page, TOC, and entries
   - HTML escaping for security

2. **`/components/PrintSettingsModal.tsx`**
   - User interface for print customization
   - Options management
   - Print preview trigger

3. **Print Options Interface**
   ```typescript
   interface PrintOptions {
     caseTitle?: string;              // Document title
     caseNumber?: string;             // Case identifier
     preparedFor?: string;            // Recipient info
     preparedBy?: string;             // Preparer info
     includePageNumbers?: boolean;    // Page numbering
     includeTableOfContents?: boolean;// TOC generation
     includeLegalSignificance?: boolean; // Legal analysis
     includeRelatedEntries?: boolean; // Cross-references
     allowPageBreaks?: boolean;       // Entry splitting
     fontSize?: "small" | "medium" | "large";
     paperSize?: "letter" | "legal";
     margins?: "narrow" | "normal" | "wide";
   }
   ```

### Design Features

#### Compact Layout
- Side-by-side date/content layout
- Minimal vertical spacing (0.75em between entries)
- Condensed typography (0.7em - 0.95em font sizes)
- Simple dividers instead of cards
- Can fit 10+ entries per page

#### Visual Hierarchy
- **Dates**: Bold, fixed-width column (MM/DD/YYYY format)
- **Titles**: Bold, larger font for scanning
- **Categories**: Small colored badges
- **Parties**: Italic text
- **Metadata**: Gray, smallest font size

#### Professional Styling
- Inter font family for modern readability
- Consistent color scheme
- Category-specific colors for quick identification
- Yellow highlight for legal significance
- Clean, minimalist design

### Current Capabilities

✅ **What Works Well**
- Fast client-side generation
- Real-time preview
- Extensive customization options
- Cross-browser compatibility
- Professional output quality
- Responsive to different paper sizes
- Smart page break handling
- Security (HTML escaping)

⚠️ **Limitations**
- No true PDF generation
- Browser-dependent print output
- Limited control over headers/footers
- No page numbering guarantee
- Manual print-to-PDF process
- No batch printing
- Memory constraints for huge documents

## Usage Flow

1. User clicks "Print Preview" button
2. Print Settings Modal opens
3. User customizes options:
   - Case information
   - Include/exclude sections
   - Formatting preferences
4. User clicks "Generate Print Preview"
5. New window opens with formatted document
6. User uses browser print function
7. Can save as PDF or print to paper

## Code Examples

### Basic Print Generation
```typescript
const printHTML = generatePrintHTML(
  entries,        // ChronologyEntry[]
  caseContext,    // string
  keyParties,     // string
  {
    caseTitle: "Smith v. Jones",
    caseNumber: "2024-CV-1234",
    fontSize: "medium",
    includeLegalSignificance: false
  }
);
```

### Opening Print Preview
```typescript
const printWindow = window.open("", "_blank");
if (printWindow) {
  printWindow.document.write(printHTML);
  printWindow.document.close();
}
```

## Next Steps & Improvements

### Short Term (Quick Wins)

1. **Add Print Templates**
   - Court-specific formats
   - Jurisdiction templates
   - Custom letterhead support
   ```typescript
   interface PrintTemplate {
     name: string;
     headerHTML?: string;
     footerHTML?: string;
     styles?: string;
   }
   ```

2. **Enhanced Metadata Display**
   - Option to include/exclude sources
   - Footnote-style references
   - Exhibit numbering

3. **Print Preview Improvements**
   - Loading indicator
   - Error handling
   - Print success confirmation

### Medium Term (1-3 months)

1. **Server-Side PDF Generation**
   ```typescript
   // Using Puppeteer or similar
   async function generatePDF(options: PrintOptions): Promise<Buffer> {
     const browser = await puppeteer.launch();
     const page = await browser.newPage();
     await page.setContent(html);
     const pdf = await page.pdf(options);
     await browser.close();
     return pdf;
   }
   ```

2. **Batch Operations**
   - Print multiple cases
   - Export to different formats
   - Bulk PDF generation

3. **Advanced Formatting**
   - Column layouts
   - Custom fonts
   - Watermarks
   - Digital signatures

### Long Term (3-6 months)

1. **Professional Report Builder**
   - Drag-and-drop layout designer
   - Custom sections
   - Charts and visualizations
   - Timeline graphics

2. **Integration Features**
   - Email PDF directly
   - Cloud storage integration
   - Document management systems
   - E-filing compatibility

3. **Performance Optimization**
   - Pagination for large documents
   - Lazy loading
   - Virtual scrolling in preview
   - Worker threads for generation

## Technical Debt & Refactoring

### Current Issues
1. HTML generation uses string concatenation (could use templating)
2. CSS is embedded in TypeScript (could be separate)
3. No unit tests for print generation
4. Limited error handling

### Suggested Refactoring
```typescript
// Move to template-based approach
import { renderToString } from 'react-dom/server';

function ChronologyPrintDocument({ entries, options }) {
  return (
    <html>
      <PrintStyles options={options} />
      <body>
        <CoverPage {...options} />
        <TableOfContents entries={entries} />
        <ChronologyEntries entries={entries} />
      </body>
    </html>
  );
}

// Generate HTML
const html = renderToString(
  <ChronologyPrintDocument entries={entries} options={options} />
);
```

## Best Practices

1. **Always escape user content**
   ```typescript
   const safe = escapeHtml(userInput);
   ```

2. **Test across browsers**
   - Chrome/Edge
   - Firefox
   - Safari

3. **Consider accessibility**
   - Proper heading hierarchy
   - Sufficient contrast
   - Clear fonts

4. **Optimize for printing**
   - Avoid background colors
   - Use print-safe fonts
   - Test on actual printers

## Troubleshooting

### Common Issues

1. **Entries breaking incorrectly**
   - Toggle "Allow entries to break across pages"
   - Adjust margins or font size

2. **Missing content in print**
   - Check browser print settings
   - Ensure "Print backgrounds" is enabled
   - Try different browser

3. **Poor quality PDF**
   - Use "Save as PDF" not "Print to PDF"
   - Check PDF quality settings
   - Try Chrome for best results

## Future Architecture Consideration

Consider moving to a more robust architecture:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│   Storage   │
│  (Preview)  │     │(PDF Gen)    │     │   (S3)      │
└─────────────┘     └─────────────┘     └─────────────┘
```

Benefits:
- Consistent output across platforms
- Better performance for large documents
- Ability to save and share PDFs
- Integration with other services
- Better analytics and monitoring

## Contributing

When adding print features:
1. Update `PrintOptions` interface
2. Add UI control to `PrintSettingsModal`
3. Implement logic in `generatePrintHTML`
4. Test across browsers
5. Update this documentation