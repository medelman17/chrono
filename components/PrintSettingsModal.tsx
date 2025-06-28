import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { PrintOptions } from '@/lib/print-chronology';

interface PrintSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (options: PrintOptions) => void;
  caseTitle?: string;
  entryCount: number;
}

export default function PrintSettingsModal({
  isOpen,
  onClose,
  onPrint,
  caseTitle = "Litigation Chronology",
  entryCount,
}: PrintSettingsModalProps) {
  const [options, setOptions] = useState<PrintOptions>({
    caseTitle,
    caseNumber: "",
    preparedFor: "",
    preparedBy: "",
    includePageNumbers: true,
    includeTableOfContents: entryCount > 10,
    includeLegalSignificance: true,
    includeRelatedEntries: true,
    fontSize: "medium",
    paperSize: "letter",
    margins: "normal",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPrint(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">Print Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Case Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Case Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Title
                </label>
                <input
                  type="text"
                  value={options.caseTitle}
                  onChange={(e) => setOptions({ ...options, caseTitle: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter case title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Number
                </label>
                <input
                  type="text"
                  value={options.caseNumber}
                  onChange={(e) => setOptions({ ...options, caseNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2024-CV-1234"
                />
              </div>
            </div>
          </div>

          {/* Prepared By/For */}
          <div>
            <h3 className="text-lg font-medium mb-4">Document Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prepared For
                </label>
                <input
                  type="text"
                  value={options.preparedFor}
                  onChange={(e) => setOptions({ ...options, preparedFor: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John Smith, Esq."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prepared By
                </label>
                <input
                  type="text"
                  value={options.preparedBy}
                  onChange={(e) => setOptions({ ...options, preparedBy: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Law Firm Name"
                />
              </div>
            </div>
          </div>

          {/* Formatting Options */}
          <div>
            <h3 className="text-lg font-medium mb-4">Formatting Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Size
                </label>
                <select
                  value={options.fontSize}
                  onChange={(e) => setOptions({ ...options, fontSize: e.target.value as "small" | "medium" | "large" })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="small">Small (11pt)</option>
                  <option value="medium">Medium (12pt)</option>
                  <option value="large">Large (14pt)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paper Size
                </label>
                <select
                  value={options.paperSize}
                  onChange={(e) => setOptions({ ...options, paperSize: e.target.value as "letter" | "legal" })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="letter">Letter (8.5" × 11")</option>
                  <option value="legal">Legal (8.5" × 14")</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Margins
                </label>
                <select
                  value={options.margins}
                  onChange={(e) => setOptions({ ...options, margins: e.target.value as "narrow" | "normal" | "wide" })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="narrow">Narrow (0.5")</option>
                  <option value="normal">Normal (1")</option>
                  <option value="wide">Wide (1.5")</option>
                </select>
              </div>
            </div>
          </div>

          {/* Include Options */}
          <div>
            <h3 className="text-lg font-medium mb-4">Include in Document</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includePageNumbers}
                  onChange={(e) => setOptions({ ...options, includePageNumbers: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include page numbers</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeTableOfContents}
                  onChange={(e) => setOptions({ ...options, includeTableOfContents: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Include table of contents {entryCount > 10 ? "(recommended for long chronologies)" : ""}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeLegalSignificance}
                  onChange={(e) => setOptions({ ...options, includeLegalSignificance: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Include legal significance analysis
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeRelatedEntries}
                  onChange={(e) => setOptions({ ...options, includeRelatedEntries: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Include related entry references
                </span>
              </label>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This will generate a print-ready chronology with {entryCount} entries. 
              The document will open in a new window where you can preview and print it.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Printer size={20} />
              Generate Print Preview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}