"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  useCallback,
  useRef,
} from "react";
import { ChronologyEntry, ChronologyFormData } from "@/types/chronology";
import { generatePrintHTML, PrintOptions } from "@/lib/print-chronology";
import PrintSettingsModal from "./PrintSettingsModal-shadcn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Users,
  FileText,
  Trash2,
  Edit3,
  MessageSquare,
  Upload,
  Save,
  Printer,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface LitigationChronologyManagerProps {
  initialCaseContext?: string;
  initialKeyParties?: string;
  initialInstructions?: string;
  caseId?: string;
}

const LitigationChronologyManager: React.FC<
  LitigationChronologyManagerProps
> = ({
  initialCaseContext = "",
  initialKeyParties = "",
  initialInstructions = "",
  caseId,
}) => {
  const [entries, setEntries] = useState<ChronologyEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<number | string>>(
    new Set()
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChronologyEntry | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterParty, setFilterParty] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isClaudeProcessing, setIsClaudeProcessing] = useState(false);
  const [claudeResponse, setClaudeResponse] = useState("");
  const [caseContext, setCaseContext] = useState(initialCaseContext);
  const [keyParties, setKeyParties] = useState(initialKeyParties);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [showCaseContext, setShowCaseContext] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingDocumentIds, setPendingDocumentIds] = useState<string[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printExportType, setPrintExportType] = useState<"full" | "filtered">(
    "full"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "none">("none");

  // Form state for new/edited entries
  const [formData, setFormData] = useState<ChronologyFormData>({
    date: "",
    time: "",
    parties: "",
    title: "",
    summary: "",
    source: "",
    category: "",
    legalSignificance: "",
    relatedEntries: "",
  });

  // Available categories for filtering and selection
  const categories = [
    "Communication",
    "Financial Transaction",
    "Legal Filing",
    "Contract",
    "Meeting/Conference",
    "Document Creation",
    "Property/Real Estate",
    "Investigation",
    "Compliance",
    "Other",
  ];

  // Load entries from database if caseId is provided
  useEffect(() => {
    if (!caseId) return;

    const fetchEntries = async () => {
      try {
        const response = await fetch(`/api/cases/${caseId}/entries`);
        if (!response.ok) throw new Error("Failed to fetch entries");
        const data = await response.json();

        // Convert date strings to match our format
        const formattedEntries = data.map((entry: ChronologyEntry) => ({
          ...entry,
          date: new Date(entry.date).toISOString().split("T")[0],
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        }));

        setEntries(formattedEntries);
      } catch (error) {
        console.error("Error fetching entries:", error);
      }
    };

    fetchEntries();
  }, [caseId]);

  // Handle file upload
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const uploadedDocIds: string[] = [];

    for (const file of fileArray) {
      const formData = new FormData();
      formData.append("file", file);
      if (caseId) {
        formData.append("caseId", caseId);
      }

      try {
        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const result = await response.json();
        uploadedDocIds.push(result.documentId);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }

    if (uploadedDocIds.length > 0) {
      setPendingDocumentIds((prev) => [...prev, ...uploadedDocIds]);
      await processDocumentsWithClaude(uploadedDocIds);
    }
  };

  // Process uploaded documents with Claude
  const processDocumentsWithClaude = async (documentIds: string[]) => {
    setIsClaudeProcessing(true);
    setClaudeResponse("");

    try {
      const response = await fetch("/api/claude/analyze-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentIds,
          caseContext,
          keyParties,
          instructions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze documents");
      }

      const data = await response.json();
      setClaudeResponse(data.analysis);

      // Parse the response to extract chronology entries
      if (data.entries && Array.isArray(data.entries)) {
        const newEntries = data.entries.map((entry: ChronologyEntry) => ({
          ...entry,
          id: Date.now() + Math.random(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          documents: documentIds.map((id) => ({
            id,
            filename: "Uploaded Document",
            fileType: "unknown",
            fileSize: 0,
          })),
        }));

        setEntries((prev) => [...prev, ...newEntries]);
      }
    } catch (error) {
      console.error("Error processing documents with Claude:", error);
      setClaudeResponse(
        "Error: Failed to analyze documents. Please try again."
      );
    } finally {
      setIsClaudeProcessing(false);
    }
  };

  // Analyze content with Claude
  const analyzeWithClaude = async () => {
    const content = (
      document.getElementById("documentContent") as HTMLTextAreaElement
    )?.value;

    if (!content) {
      alert("Please paste or type document content to analyze");
      return;
    }

    setIsClaudeProcessing(true);
    setClaudeResponse("");

    try {
      const response = await fetch("/api/claude/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          caseContext,
          keyParties,
          instructions,
          documentIds: pendingDocumentIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze content");
      }

      const data = await response.json();
      setClaudeResponse(data.analysis);

      // Parse the response to extract chronology entries
      if (data.entries && Array.isArray(data.entries)) {
        const newEntries = data.entries.map((entry: ChronologyEntry) => ({
          ...entry,
          id: Date.now() + Math.random(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          documents: pendingDocumentIds.map((id) => ({
            id,
            filename: "Uploaded Document",
            fileType: "unknown",
            fileSize: 0,
          })),
        }));

        setEntries((prev) => [...prev, ...newEntries]);
        setPendingDocumentIds([]); // Clear pending document IDs after successful processing
      }
    } catch (error) {
      console.error("Error analyzing with Claude:", error);
      setClaudeResponse(
        "Error: Failed to analyze content. Please check your API key and try again."
      );
    } finally {
      setIsClaudeProcessing(false);
      // Clear the textarea after processing
      const textarea = document.getElementById(
        "documentContent"
      ) as HTMLTextAreaElement;
      if (textarea) textarea.value = "";
    }
  };

  // Get unique parties from all entries
  const getUniqueParties = () => {
    const parties = new Set<string>();
    entries.forEach((entry) => {
      const entryParties = entry.parties.split(/[,;]/).map((p) => p.trim());
      entryParties.forEach((p) => {
        if (p) parties.add(p);
      });
    });
    return Array.from(parties).sort();
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => {
      if (prev === "none") return "desc";
      if (prev === "desc") return "asc";
      return "none";
    });
  };

  // Toggle entry expansion
  const toggleEntryExpanded = (id: number | string) => {
    setExpandedEntries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle form input changes
  const handleInputChange = (
    field: keyof ChronologyFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save entry (create or update)
  const saveEntry = async () => {
    if (!formData.date || !formData.title || !formData.summary) {
      alert("Please fill in required fields: Date, Title, and Summary");
      return;
    }

    const entryData = {
      ...formData,
      createdAt: editingEntry
        ? editingEntry.createdAt
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents:
        editingEntry?.documents ||
        (pendingDocumentIds.length > 0
          ? pendingDocumentIds.map((id) => ({
              id,
              filename: "Uploaded Document",
              fileType: "unknown",
              fileSize: 0,
            }))
          : undefined),
    };

    try {
      if (caseId) {
        // Save to database
        const url = editingEntry
          ? `/api/cases/${caseId}/entries/${editingEntry.id}`
          : `/api/cases/${caseId}/entries`;

        const response = await fetch(url, {
          method: editingEntry ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entryData),
        });

        if (!response.ok) throw new Error("Failed to save entry");

        const savedEntry = await response.json();

        if (editingEntry) {
          // Update existing entry
          setEntries((prev) =>
            prev.map((e) =>
              e.id === editingEntry.id
                ? {
                    ...savedEntry,
                    date: new Date(savedEntry.date).toISOString().split("T")[0],
                  }
                : e
            )
          );
        } else {
          // Add new entry
          setEntries((prev) => [
            ...prev,
            {
              ...savedEntry,
              date: new Date(savedEntry.date).toISOString().split("T")[0],
            },
          ]);
        }
      } else {
        // Local storage only
        if (editingEntry) {
          setEntries((prev) =>
            prev.map((e) =>
              e.id === editingEntry.id
                ? { ...entryData, id: editingEntry.id }
                : e
            )
          );
        } else {
          const newEntry = {
            ...entryData,
            id: Date.now(),
          };
          setEntries((prev) => [...prev, newEntry]);
        }
      }

      resetForm();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry. Please try again.");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: "",
      time: "",
      parties: "",
      title: "",
      summary: "",
      source: "",
      category: "",
      legalSignificance: "",
      relatedEntries: "",
    });
    setShowAddForm(false);
    setEditingEntry(null);
    setClaudeResponse("");
    setPendingDocumentIds([]); // Clear pending document IDs
  };

  // Delete entry
  const deleteEntry = async (id: number | string) => {
    if (confirm("Are you sure you want to delete this chronology entry?")) {
      try {
        if (caseId) {
          // Delete from database if we have a caseId
          const response = await fetch(`/api/cases/${caseId}/entries/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error("Failed to delete entry");
        }

        // Remove from local state
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } catch (error) {
        console.error("Error deleting entry:", error);
        alert("Failed to delete entry. Please try again.");
      }
    }
  };

  // Edit entry
  const editEntry = (entry: ChronologyEntry) => {
    setFormData(entry);
    setEditingEntry(entry);
    setShowAddForm(true);
  };

  // Handle document download
  const handleDocumentDownload = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);

      if (!response.ok) {
        throw new Error("Failed to download document");
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : "download";

      // Create a blob from the response
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Failed to download document. Please try again.");
    }
  };

  // Save case context data
  const saveCaseContext = useCallback(
    async (showAlert = true) => {
      if (!caseId) return;

      setIsSaving(true);
      try {
        const response = await fetch(`/api/cases/${caseId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            caseContext,
            keyParties,
            instructions,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save case context");
        }

        setLastSaved(new Date());

        // Show success feedback only if requested
        if (showAlert) {
          alert("Case context saved successfully!");
        }
      } catch (error) {
        console.error("Error saving case context:", error);
        if (showAlert) {
          alert("Failed to save case context. Please try again.");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [caseId, caseContext, keyParties, instructions]
  );

  // Debounced auto-save function
  const debouncedSave = useCallback(() => {
    if (!caseId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveCaseContext(false); // Don&apos;t show alert for auto-save
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [caseId, saveCaseContext]);

  // Trigger auto-save when context data changes
  useEffect(() => {
    debouncedSave();

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [caseContext, keyParties, instructions, debouncedSave]);

  // Filter and sort entries based on search and filters
  const filteredEntries = entries
    .filter((entry) => {
      const matchesSearch =
        !searchTerm ||
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.parties.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === "all" || entry.category === filterCategory;
      const matchesParty =
        filterParty === "all" ||
        entry.parties.toLowerCase().includes(filterParty.toLowerCase());

      const entryDate = new Date(entry.date);
      const matchesDateRange =
        (!startDate || entryDate >= new Date(startDate)) &&
        (!endDate || entryDate <= new Date(endDate));

      return (
        matchesSearch && matchesCategory && matchesParty && matchesDateRange
      );
    })
    .sort((a, b) => {
      if (sortOrder === "none") return 0;

      const dateA = new Date(a.date + (a.time ? ` ${a.time}` : ""));
      const dateB = new Date(b.date + (b.time ? ` ${b.time}` : ""));

      if (sortOrder === "asc") {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });

  // Export chronology
  const exportChronology = async (exportType = "full") => {
    const entriesToExport =
      exportType === "filtered" ? filteredEntries : entries;

    if (entriesToExport.length === 0) {
      alert("No entries to export");
      return;
    }

    try {
      const keyParties =
        (document.getElementById("keyParties") as HTMLTextAreaElement)?.value ||
        "";

      const caseContextForExport =
        caseContext || keyParties
          ? `

CASE CONTEXT:
${caseContext ? `${caseContext}\n` : ""}
${keyParties ? `Key Parties: ${keyParties}\n` : ""}`
          : "";

      // Create formatted export text
      const exportText = `LITIGATION CHRONOLOGY
Generated: ${new Date().toLocaleString()}
Total Entries: ${entriesToExport.length}
${caseContextForExport}

===============================================

${entriesToExport
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  .map(
    (entry, index) => `
${index + 1}. ${entry.date}${entry.time ? ` at ${entry.time}` : ""}
Title: ${entry.title}
Parties: ${entry.parties}
Category: ${entry.category || "N/A"}

SUMMARY:
${entry.summary}

${
  entry.legalSignificance
    ? `LEGAL SIGNIFICANCE:\n${entry.legalSignificance}\n`
    : ""
}
${entry.source ? `Source: ${entry.source}` : ""}
${entry.relatedEntries ? `Related Entries: ${entry.relatedEntries}` : ""}

-------------------------------------------`
  )
  .join("\n")}`;

      // Download the file
      const blob = new Blob([exportText], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chronology_${exportType}_${
        new Date().toISOString().split("T")[0]
      }.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting chronology:", error);
      alert("Failed to export chronology. Please try again.");
    }
  };

  // Open print modal
  const openPrintModal = (type: "full" | "filtered") => {
    setPrintExportType(type);
    setShowPrintModal(true);
  };

  // Print preview
  const printPreview = (options: PrintOptions) => {
    const entriesToPrint =
      printExportType === "filtered" ? filteredEntries : entries;

    const printContent = generatePrintHTML(
      entriesToPrint,
      caseContext,
      keyParties,
      options
    );

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Case Context Section */}
        <Card className="mb-6">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowCaseContext(!showCaseContext)}
          >
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Case Context & AI Instructions</CardTitle>
                <CardDescription>
                  Provide context to help Claude analyze documents more
                  effectively
                </CardDescription>
              </div>
              <span className="text-xl">{showCaseContext ? "−" : "+"}</span>
            </div>
          </CardHeader>

          {showCaseContext && (
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="caseContext">Case Overview & Context</Label>
                <Textarea
                  id="caseContext"
                  value={caseContext}
                  onChange={(e) => setCaseContext(e.target.value)}
                  placeholder="Describe the case: What type of litigation is this? What are the key legal issues? What are you trying to prove or defend against?

Example: 'This is a commercial real estate dispute involving a failed purchase of an office building. Key issues include: breach of contract, fraudulent misrepresentation of property condition, and damages. We represent the buyer who claims the seller concealed structural defects. Focus on communications about property inspections, financial transactions, and any statements about building condition.'"
                  rows={6}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keyParties">Key Parties & Roles</Label>
                  <Textarea
                    id="keyParties"
                    placeholder="List main parties and their roles:
• John Smith (Buyer/Plaintiff)
• ABC Properties LLC (Seller/Defendant) 
• Mary Johnson (Real Estate Agent)
• Building Inspector Co. (Third Party)"
                    rows={4}
                    className="mt-1"
                    value={keyParties}
                    onChange={(e) => setKeyParties(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="claudeInstructions">
                    Analysis Instructions for Claude
                  </Label>
                  <Textarea
                    id="claudeInstructions"
                    placeholder="Special instructions:
• Pay attention to dates around the inspection period
• Flag any communications about structural issues
• Note financial transaction timing
• Identify potential witness statements"
                    rows={4}
                    className="mt-1"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    💡 Pro Tip:
                  </h4>
                  <p className="text-sm text-blue-800">
                    The more context you provide, the better Claude can identify
                    legal significance, categorize events, and ask relevant
                    clarifying questions. Update this as your case develops.
                  </p>
                </CardContent>
              </Card>

              {/* Save button for case context */}
              {caseId && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {isSaving && "Saving..."}
                    {!isSaving && lastSaved && (
                      <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                    )}
                  </div>
                  <Button
                    onClick={() => saveCaseContext(true)}
                    disabled={isSaving}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Case Context"}
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>

              <Button
                onClick={toggleSortOrder}
                variant="outline"
                className="flex items-center gap-2"
                title={`Sort by date: ${
                  sortOrder === "none"
                    ? "unsorted"
                    : sortOrder === "asc"
                    ? "oldest first"
                    : "newest first"
                }`}
              >
                {sortOrder === "none" && <ArrowUpDown className="w-4 h-4" />}
                {sortOrder === "asc" && <ArrowUp className="w-4 h-4" />}
                {sortOrder === "desc" && <ArrowDown className="w-4 h-4" />}
                Sort Date
              </Button>

              <Button
                onClick={() => exportChronology("full")}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>

              <Button
                onClick={() => exportChronology("filtered")}
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Filter className="w-4 h-4 mr-2" />
                Export Filtered
              </Button>

              <Button
                onClick={() => openPrintModal("full")}
                variant="default"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Preview
              </Button>

              <div className="text-sm text-gray-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {entries.length} total entries
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterParty} onValueChange={setFilterParty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Parties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                  {getUniqueParties().map((party) => (
                    <SelectItem key={party} value={party}>
                      {party}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Analysis Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Claude Document Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload Section */}
            <Card className="border-2 border-dashed">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <label htmlFor="fileInput" className="cursor-pointer">
                    <span className="text-lg font-medium text-gray-700">
                      Upload Documents
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      EML, TXT, DOC, images, or other text-based litigation
                      documents
                    </p>
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      ⚠️ PDFs: Copy/paste content below instead of uploading for
                      better results
                    </p>
                    <input
                      id="fileInput"
                      type="file"
                      multiple
                      accept=".pdf,.eml,.txt,.doc,.docx,.png,.jpg,.jpeg,.gif,.msg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-600 mt-4">
                    Or drag and drop files here
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Text Input Section */}
            <div>
              <Label htmlFor="documentContent">Paste Document Content</Label>
              <Textarea
                id="documentContent"
                placeholder="Paste document content here for Claude to analyze..."
                rows={6}
                className="mt-1"
              />
            </div>

            <Button
              onClick={analyzeWithClaude}
              disabled={isClaudeProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isClaudeProcessing ? "Analyzing..." : "Analyze with Claude"}
            </Button>

            {/* Claude Response */}
            {claudeResponse && (
              <Card
                className={cn(
                  "mt-4",
                  claudeResponse.startsWith("Error")
                    ? "border-red-200 bg-red-50"
                    : "border-green-200 bg-green-50"
                )}
              >
                <CardContent className="pt-6">
                  <h4
                    className={cn(
                      "font-semibold mb-2",
                      claudeResponse.startsWith("Error")
                        ? "text-red-800"
                        : "text-green-800"
                    )}
                  >
                    Claude&apos;s Analysis:
                  </h4>
                  <div
                    className={cn(
                      "whitespace-pre-wrap",
                      claudeResponse.startsWith("Error")
                        ? "text-red-700"
                        : "text-green-700"
                    )}
                  >
                    {claudeResponse}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Entry Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingEntry ? "Edit" : "Add"} Chronology Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="parties">Parties Involved</Label>
                  <Input
                    id="parties"
                    type="text"
                    placeholder="e.g., John Smith, ABC Corp"
                    value={formData.parties}
                    onChange={(e) =>
                      handleInputChange("parties", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Email from M. Edelman to K. Maloney re: Contract Terms"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="summary">Factual Summary *</Label>
                <Textarea
                  id="summary"
                  placeholder="Objective description of what occurred..."
                  value={formData.summary}
                  onChange={(e) => handleInputChange("summary", e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  type="text"
                  placeholder="e.g., Email attachment, Deposition transcript p. 45"
                  value={formData.source}
                  onChange={(e) => handleInputChange("source", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="legalSignificance">Legal Significance</Label>
                <Textarea
                  id="legalSignificance"
                  placeholder="Analysis of potential legal significance in the litigation..."
                  value={formData.legalSignificance}
                  onChange={(e) =>
                    handleInputChange("legalSignificance", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="relatedEntries">Related Entries</Label>
                <Input
                  id="relatedEntries"
                  type="text"
                  placeholder="References to other chronology entries..."
                  value={formData.relatedEntries}
                  onChange={(e) =>
                    handleInputChange("relatedEntries", e.target.value)
                  }
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={saveEntry}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingEntry ? "Update" : "Save"} Entry
                </Button>
                <Button onClick={resetForm} variant="secondary">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chronology Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Chronology Entries ({filteredEntries.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {filteredEntries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {entries.length === 0
                    ? "No chronology entries yet. Add your first entry above."
                    : "No entries match your current filters."}
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div key={entry.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">
                            {entry.date} {entry.time && `at ${entry.time}`}
                          </span>
                        </div>

                        {entry.category && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {entry.category}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => editEntry(entry)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteEntry(entry.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-2">
                      {entry.title}
                    </h4>

                    {entry.parties && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                        <Users className="w-3 h-3" />
                        <span>{entry.parties}</span>
                      </div>
                    )}

                    <p className="text-gray-700 mb-3">{entry.summary}</p>

                    {(entry.legalSignificance || entry.relatedEntries) && (
                      <div className="border-t border-gray-200 pt-3">
                        <button
                          onClick={() => toggleEntryExpanded(entry.id)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-2"
                        >
                          <span>
                            {expandedEntries.has(entry.id) ? "−" : "+"}
                          </span>
                          <span>Legal Analysis & Related Entries</span>
                        </button>

                        {expandedEntries.has(entry.id) && (
                          <div className="space-y-3">
                            {entry.legalSignificance && (
                              <Card className="bg-yellow-50 border-yellow-200">
                                <CardContent className="pt-4">
                                  <h5 className="text-sm font-medium text-yellow-800 mb-1">
                                    Legal Significance:
                                  </h5>
                                  <p className="text-sm text-yellow-700">
                                    {entry.legalSignificance}
                                  </p>
                                </CardContent>
                              </Card>
                            )}

                            {entry.relatedEntries && (
                              <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="pt-4">
                                  <h5 className="text-sm font-medium text-blue-800 mb-1">
                                    Related Entries:
                                  </h5>
                                  <p className="text-sm text-blue-700">
                                    {entry.relatedEntries}
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-500 mt-3">
                      <div className="flex items-center gap-3">
                        {entry.source && <span>Source: {entry.source}</span>}
                        {entry.documents && entry.documents.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-600">Documents:</span>
                            {entry.documents.map((doc, idx) => (
                              <button
                                key={doc.id}
                                onClick={() => handleDocumentDownload(doc.id)}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                                title={`Download ${doc.filename}`}
                              >
                                <FileText className="w-3 h-3" />
                                <span>{doc.filename}</span>
                                {idx < entry.documents!.length - 1 && (
                                  <span className="text-gray-400">,</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <span>
                        Created:{" "}
                        {new Date(entry.createdAt).toLocaleDateString()}
                        {entry.updatedAt !== entry.createdAt &&
                          ` • Updated: ${new Date(
                            entry.updatedAt
                          ).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Print Settings Modal */}
        <PrintSettingsModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          onPrint={printPreview}
          entryCount={
            printExportType === "filtered"
              ? filteredEntries.length
              : entries.length
          }
        />
      </div>
    </div>
  );
};

export default LitigationChronologyManager;
