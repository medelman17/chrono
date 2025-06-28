import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { PrintOptions } from '@/lib/print-chronology';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

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
    allowPageBreaks: false,
    fontSize: "medium",
    paperSize: "letter",
    margins: "normal",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPrint(options);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Settings</DialogTitle>
          <DialogDescription>
            Configure your chronology print settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Case Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseTitle">Case Title</Label>
                <Input
                  id="caseTitle"
                  type="text"
                  value={options.caseTitle}
                  onChange={(e) => setOptions({ ...options, caseTitle: e.target.value })}
                  placeholder="Enter case title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caseNumber">Case Number</Label>
                <Input
                  id="caseNumber"
                  type="text"
                  value={options.caseNumber}
                  onChange={(e) => setOptions({ ...options, caseNumber: e.target.value })}
                  placeholder="e.g., 2024-CV-1234"
                />
              </div>
            </div>
          </div>

          {/* Prepared By/For */}
          <div>
            <h3 className="text-lg font-medium mb-4">Document Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preparedFor">Prepared For</Label>
                <Input
                  id="preparedFor"
                  type="text"
                  value={options.preparedFor}
                  onChange={(e) => setOptions({ ...options, preparedFor: e.target.value })}
                  placeholder="e.g., John Smith, Esq."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preparedBy">Prepared By</Label>
                <Input
                  id="preparedBy"
                  type="text"
                  value={options.preparedBy}
                  onChange={(e) => setOptions({ ...options, preparedBy: e.target.value })}
                  placeholder="e.g., Law Firm Name"
                />
              </div>
            </div>
          </div>

          {/* Formatting Options */}
          <div>
            <h3 className="text-lg font-medium mb-4">Formatting Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Select
                  value={options.fontSize}
                  onValueChange={(value) => setOptions({ ...options, fontSize: value as "small" | "medium" | "large" })}
                >
                  <SelectTrigger id="fontSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (11pt)</SelectItem>
                    <SelectItem value="medium">Medium (12pt)</SelectItem>
                    <SelectItem value="large">Large (14pt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paperSize">Paper Size</Label>
                <Select
                  value={options.paperSize}
                  onValueChange={(value) => setOptions({ ...options, paperSize: value as "letter" | "legal" })}
                >
                  <SelectTrigger id="paperSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">Letter (8.5&quot; × 11&quot;)</SelectItem>
                    <SelectItem value="legal">Legal (8.5&quot; × 14&quot;)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="margins">Margins</Label>
                <Select
                  value={options.margins}
                  onValueChange={(value) => setOptions({ ...options, margins: value as "narrow" | "normal" | "wide" })}
                >
                  <SelectTrigger id="margins">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narrow">Narrow (0.5&quot;)</SelectItem>
                    <SelectItem value="normal">Normal (1&quot;)</SelectItem>
                    <SelectItem value="wide">Wide (1.5&quot;)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Include Options */}
          <div>
            <h3 className="text-lg font-medium mb-4">Include in Document</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePageNumbers"
                  checked={options.includePageNumbers}
                  onCheckedChange={(checked) => setOptions({ ...options, includePageNumbers: checked as boolean })}
                />
                <Label
                  htmlFor="includePageNumbers"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include page numbers
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTableOfContents"
                  checked={options.includeTableOfContents}
                  onCheckedChange={(checked) => setOptions({ ...options, includeTableOfContents: checked as boolean })}
                />
                <Label
                  htmlFor="includeTableOfContents"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include table of contents {entryCount > 10 ? "(recommended for long chronologies)" : ""}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeLegalSignificance"
                  checked={options.includeLegalSignificance}
                  onCheckedChange={(checked) => setOptions({ ...options, includeLegalSignificance: checked as boolean })}
                />
                <Label
                  htmlFor="includeLegalSignificance"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include legal significance analysis
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRelatedEntries"
                  checked={options.includeRelatedEntries}
                  onCheckedChange={(checked) => setOptions({ ...options, includeRelatedEntries: checked as boolean })}
                />
                <Label
                  htmlFor="includeRelatedEntries"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include related entry references
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowPageBreaks"
                  checked={options.allowPageBreaks}
                  onCheckedChange={(checked) => setOptions({ ...options, allowPageBreaks: checked as boolean })}
                />
                <Label
                  htmlFor="allowPageBreaks"
                  className="text-sm font-normal cursor-pointer"
                >
                  Allow entries to break across pages (more compact)
                </Label>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will generate a print-ready chronology with {entryCount} entries. 
                The document will open in a new window where you can preview and print it.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Generate Print Preview
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}