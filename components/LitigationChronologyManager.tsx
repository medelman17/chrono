"use client";

import React, { useState, useEffect, ChangeEvent, useCallback, useRef } from "react";
import { ChronologyEntry, ChronologyFormData } from "@/types/chronology";
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
} from "lucide-react";

interface LitigationChronologyManagerProps {
  initialCaseContext?: string;
  initialKeyParties?: string;
  initialInstructions?: string;
  caseId?: string;
}

const LitigationChronologyManager: React.FC<LitigationChronologyManagerProps> = ({
  initialCaseContext = "",
  initialKeyParties = "",
  initialInstructions = "",
  caseId,
}) => {
  const [entries, setEntries] = useState<ChronologyEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<number | string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChronologyEntry | null>(null);
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
        if (!response.ok) throw new Error('Failed to fetch entries');
        const data = await response.json();
        
        // Convert date strings to match our format
        const formattedEntries = data.map((entry: ChronologyEntry) => ({
          ...entry,
          date: new Date(entry.date).toISOString().split('T')[0],
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        }));
        
        setEntries(formattedEntries);
      } catch (error) {
        console.error('Error fetching entries:', error);
      }
    };
    
    fetchEntries();
  }, [caseId]);

  // Toggle expanded state for entry details
  const toggleEntryExpanded = (entryId: number | string) => {
    setExpandedEntries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  // Get unique parties from all entries
  const getUniqueParties = () => {
    const allParties = entries.flatMap((entry) => entry.parties.split(",").map((p) => p.trim()));
    return [...new Set(allParties)].filter((p) => p.length > 0);
  };

  // Handle form input changes
  const handleInputChange = (field: keyof ChronologyFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle file uploads
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    setIsClaudeProcessing(true);
    setClaudeResponse("Uploading and processing files...");

    try {
      // Process files one by one (since our API handles single files)
      let allContent = "";
      const processedFiles = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (caseId) {
          formData.append('caseId', caseId);
        }

        // Upload file to our API for processing
        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          processedFiles.push({
            name: file.name,
            error: error.error || 'Upload failed'
          });
          continue;
        }

        const uploadResult = await uploadResponse.json();
        processedFiles.push(uploadResult);
        
        // Add to combined content
        if (uploadResult.content) {
          allContent += `\n\n--- FILE: ${uploadResult.name} (${Math.round(uploadResult.fileSize / 1024)}KB) ---\n${uploadResult.content}\n--- END FILE ---\n`;
        }
      }

      // Get additional context from user input
      const userContext = (document.getElementById("userContext") as HTMLTextAreaElement)?.value || "";

      // Extract document IDs from processed files
      const documentIds = processedFiles
        .filter(file => file.id && !file.error)
        .map(file => file.id);
      
      // Analyze all files with Claude
      await analyzeWithClaude(allContent, userContext, documentIds);
    } catch (error) {
      setClaudeResponse(`Error processing files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clear the file input
      event.target.value = "";
    }
  };


  // Claude integration for document analysis
  const analyzeWithClaude = async (documentText: string, userContext: string = "", documentIds: string[] = []): Promise<void> => {
    setIsClaudeProcessing(true);
    setClaudeResponse("");
    setPendingDocumentIds(documentIds); // Store document IDs for linking

    try {
      // const existingChronologyContext =
      //   entries.length > 0
      //     ? `\n\nEXISTING CHRONOLOGY CONTEXT:\n${entries
      //         .map(
      //           (entry) => `${entry.date} ${entry.time || ""} - ${entry.title}: ${entry.summary.substring(0, 100)}...`
      //         )
      //         .join("\n")}`
      //     : "";

      // Get additional case context information
      // const keyParties = (document.getElementById("keyParties") as HTMLTextAreaElement)?.value || "";
      // const claudeInstructions = (document.getElementById("claudeInstructions") as HTMLTextAreaElement)?.value || "";

      // const caseContextSection =
      //   caseContext || keyParties || claudeInstructions
      //     ? `
      //
      // CASE CONTEXT:
      // ${caseContext ? `Case Overview: ${caseContext}` : ""}
      // ${keyParties ? `\nKey Parties: ${keyParties}` : ""}
      // ${claudeInstructions ? `\nSpecial Instructions: ${claudeInstructions}` : ""}`
      //     : "";

      // const prompt = `You are assisting with litigation chronology development. Please analyze the following document/information and create a chronology entry.
      // ${caseContextSection}
      //
      // DOCUMENT/INFORMATION TO ANALYZE:
      // ${documentText}
      //
      // USER CONTEXT (if provided): ${userContext}
      // ${existingChronologyContext}
      //
      // INSTRUCTIONS:
      // - Use the case context above to better understand the legal significance of events
      // - Consider how this document/event relates to the key legal issues and parties mentioned
      // - If analyzing email files (.eml), extract sender, recipient, date, subject, and body content
      // - For PDF files noted as binary, acknowledge the limitation and ask for specific details
      // - For images, note that visual analysis would be needed and ask for description of content
      // - For multiple files, create separate entries or identify if they relate to a single event
      // - Pay attention to timestamps, metadata, and document headers
      // - Consider the document source (email, legal filing, public record, etc.) in your analysis
      // - Follow any special instructions provided in the case context
      //
      // Please provide a JSON response with the following structure:
      // {
      //   "date": "YYYY-MM-DD format",
      //   "time": "HH:MM format if available, otherwise empty string",
      //   "parties": "comma-separated list of parties involved",
      //   "title": "Event title in format: [Document Type] from [Party] to [Party] re: [Subject] or similar",
      //   "summary": "Factual summary of what occurred - be precise and objective",
      //   "category": "Choose from: Communication, Financial Transaction, Legal Filing, Contract, Meeting/Conference, Document Creation, Property/Real Estate, Investigation, Compliance, Other",
      //   "legalSignificance": "Analysis of potential legal significance in context of litigation",
      //   "questions": "Array of clarifying questions if context is unclear or if you need more information",
      //   "relatedEntries": "Suggested connections to existing chronology entries if applicable",
      //   "sourceInfo": "Details about the document source, file type, and any metadata"
      // }
      //
      // IMPORTANT: If you need clarification about dates, parties, context, relevance, or if files cannot be fully processed, include specific questions in the "questions" array. Be thorough but concise in your analysis.
      //
      // Respond ONLY with valid JSON. Do not include any text outside the JSON structure.`;

      // Get key parties and instructions from form elements
      const keyPartiesElement = document.getElementById("keyParties") as HTMLTextAreaElement;
      const instructionsElement = document.getElementById("claudeInstructions") as HTMLTextAreaElement;
      
      // Call our API endpoint for Claude analysis
      const analysisResponse = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: documentText,
          filename: 'Multiple files',
          caseContext: caseContext,
          keyParties: keyPartiesElement?.value || initialKeyParties,
          instructions: instructionsElement?.value || initialInstructions,
          userContext: userContext,
          existingEntries: entries.map(entry => ({
            date: entry.date,
            time: entry.time,
            title: entry.title,
            summary: entry.summary
          }))
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error(`Analysis failed: ${analysisResponse.statusText}`);
      }

      const analysisData = await analysisResponse.json();
      
      // Handle the response which contains entries array
      if (analysisData.error && analysisData.rawResponse) {
        // If parsing failed, try to extract JSON from raw response
        const cleanResponse = analysisData.rawResponse.trim();
        if (cleanResponse.includes('{')) {
          const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.entries && parsed.entries.length > 0) {
                analysisData.entries = parsed.entries;
              }
            } catch (e) {
              console.error('Failed to parse raw response:', e);
            }
          }
        }
      }
      
      // Use the first entry if multiple were returned
      const analysisResult = analysisData.entries && analysisData.entries.length > 0 
        ? analysisData.entries[0] 
        : {};

      // Pre-populate form with Claude's analysis
      setFormData({
        date: analysisResult.date || "",
        time: analysisResult.time || "",
        parties: analysisResult.parties || "",
        title: analysisResult.title || "",
        summary: analysisResult.summary || "",
        source: analysisResult.source || analysisResult.sourceInfo || "Document Analysis",
        category: analysisResult.category || "",
        legalSignificance: analysisResult.legalSignificance || "",
        relatedEntries: analysisResult.relatedEntries || "",
      });

      // Show Claude's response and any questions
      let responseText = `Claude has analyzed the document and pre-populated the form below.\n\n`;
      if (analysisResult.questions && analysisResult.questions.length > 0) {
        responseText += `CLARIFYING QUESTIONS:\n${analysisResult.questions
          .map((q: string, i: number) => `${i + 1}. ${q}`)
          .join("\n")}\n\n`;
        responseText += `Please review the suggested entry and provide additional context for any questions above.`;
      } else {
        responseText += `Review the suggested chronology entry below and make any necessary adjustments before saving.`;
      }

      setClaudeResponse(responseText);
      setShowAddForm(true);
    } catch (error) {
      setClaudeResponse(`Error analyzing document: ${error instanceof Error ? error.message : 'Unknown error'}. Please create the entry manually.`);
      setShowAddForm(true);
    } finally {
      setIsClaudeProcessing(false);
    }
  };

  // Save entry (create or update)
  const saveEntry = async () => {
    if (!formData.date || !formData.title || !formData.summary) {
      alert("Please fill in required fields: Date, Title, and Summary");
      return;
    }

    try {
      if (caseId) {
        // Save to database if we have a caseId
        if (editingEntry) {
          // Update existing entry
          const response = await fetch(`/api/cases/${caseId}/entries/${editingEntry.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
          
          if (!response.ok) throw new Error('Failed to update entry');
          const updatedEntry = await response.json();
          
          setEntries((prev) => prev.map((e) => 
            e.id === editingEntry.id 
              ? { ...updatedEntry, date: new Date(updatedEntry.date).toISOString().split('T')[0] }
              : e
          ));
        } else {
          // Create new entry
          const response = await fetch(`/api/cases/${caseId}/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              documentIds: pendingDocumentIds, // Include document IDs to link
            }),
          });
          
          if (!response.ok) throw new Error('Failed to create entry');
          const newEntry = await response.json();
          
          setEntries((prev) =>
            [...prev, { ...newEntry, date: new Date(newEntry.date).toISOString().split('T')[0] }].sort(
              (a, b) => new Date(a.date + " " + (a.time || "00:00")).getTime() - new Date(b.date + " " + (b.time || "00:00")).getTime()
            )
          );
        }
      } else {
        // Local-only mode (no database)
        const entry = {
          id: editingEntry ? editingEntry.id : Date.now(),
          ...formData,
          createdAt: editingEntry ? editingEntry.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (editingEntry) {
          setEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? entry : e)));
        } else {
          setEntries((prev) =>
            [...prev, entry].sort(
              (a, b) => new Date(a.date + " " + (a.time || "00:00")).getTime() - new Date(b.date + " " + (b.time || "00:00")).getTime()
            )
          );
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    }
  };

  // Reset form and close
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
            method: 'DELETE',
          });
          
          if (!response.ok) throw new Error('Failed to delete entry');
        }
        
        // Remove from local state
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry. Please try again.');
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
        throw new Error('Failed to download document');
      }
      
      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'download';
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  // Save case context data
  const saveCaseContext = useCallback(async (showAlert = true) => {
    if (!caseId) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseContext,
          keyParties,
          instructions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save case context');
      }

      setLastSaved(new Date());
      
      // Show success feedback only if requested
      if (showAlert) {
        alert('Case context saved successfully!');
      }
    } catch (error) {
      console.error('Error saving case context:', error);
      if (showAlert) {
        alert('Failed to save case context. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  }, [caseId, caseContext, keyParties, instructions]);

  // Debounced auto-save function
  const debouncedSave = useCallback(() => {
    if (!caseId) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveCaseContext(false); // Don't show alert for auto-save
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

  // Filter entries based on search and filters
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !searchTerm ||
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.parties.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === "all" || entry.category === filterCategory;
    const matchesParty = filterParty === "all" || entry.parties.toLowerCase().includes(filterParty.toLowerCase());

    const entryDate = new Date(entry.date);
    const matchesDateRange =
      (!startDate || entryDate >= new Date(startDate)) && (!endDate || entryDate <= new Date(endDate));

    return matchesSearch && matchesCategory && matchesParty && matchesDateRange;
  });

  // Export chronology
  const exportChronology = async (exportType = "full") => {
    const entriesToExport = exportType === "filtered" ? filteredEntries : entries;

    if (entriesToExport.length === 0) {
      alert("No entries to export");
      return;
    }

    try {
      const keyParties = (document.getElementById("keyParties") as HTMLTextAreaElement)?.value || "";
      // const claudeInstructions = (document.getElementById("claudeInstructions") as HTMLTextAreaElement)?.value || "";

      const caseContextForExport =
        caseContext || keyParties
          ? `

CASE CONTEXT:
${caseContext ? `${caseContext}\n` : ""}
${keyParties ? `Key Parties: ${keyParties}\n` : ""}`
          : "";

      // const prompt = `Create a professional litigation chronology document from the following entries. Format it as a formal chronology suitable for court filing or legal brief attachment.
      // ${caseContextForExport}
      // CHRONOLOGY ENTRIES:
      // ${entriesToExport
      //   .map(
      //     (entry) => `
      // Date: ${entry.date} ${entry.time || ""}
      // Title: ${entry.title}
      // Parties: ${entry.parties}
      // Summary: ${entry.summary}
      // Category: ${entry.category}
      // Legal Significance: ${entry.legalSignificance}
      // Source: ${entry.source}
      // ---`
      //   )
      //   .join("\n")}
      //
      // Please format this as a professional chronology with:
      // - Proper header including case context if provided
      // - Chronological order by date
      // - Consistent formatting
      // - Each entry clearly delineated
      // - Professional language suitable for litigation
      //
      // Return the formatted chronology ready for use in legal proceedings.`;

      // TODO: Replace with API call to export endpoint
      // const response = await window.claude.complete(prompt);

      // For now, create a simple text export without Claude formatting
      const formattedChronology = `LITIGATION CHRONOLOGY
${caseContextForExport}
${'='.repeat(50)}

${entriesToExport.map(entry => `
${entry.date}${entry.time ? ' ' + entry.time : ''}
${entry.title}
Parties: ${entry.parties}
${entry.summary}
Category: ${entry.category}
Legal Significance: ${entry.legalSignificance}
Source: ${entry.source}
${'—'.repeat(40)}
`).join('\n')}`;

      // Create and download the chronology
      const blob = new Blob([formattedChronology], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chronology-${exportType}-${new Date().toISOString().split("T")[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Error generating chronology: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Litigation Chronology Manager</h1>
          <p className="text-gray-600">AI-powered chronology development for litigation case management</p>
        </div>

        {/* Case Context Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div
            className="p-6 border-b border-gray-200 cursor-pointer flex justify-between items-center hover:bg-gray-50"
            onClick={() => setShowCaseContext(!showCaseContext)}
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Case Context & Instructions</h3>
              <p className="text-sm text-gray-600">
                Provide case background to help Claude with analysis and legal significance
              </p>
            </div>
            <div className="text-gray-400">{showCaseContext ? "−" : "+"}</div>
          </div>

          {showCaseContext && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Case Overview & Legal Issues</label>
                <textarea
                  value={caseContext}
                  onChange={(e) => setCaseContext(e.target.value)}
                  placeholder="Describe the case: What type of litigation is this? What are the key legal issues? What are you trying to prove or defend against?

Example: 'This is a commercial real estate dispute involving a failed purchase of an office building. Key issues include: breach of contract, fraudulent misrepresentation of property condition, and damages. We represent the buyer who claims the seller concealed structural defects. Focus on communications about property inspections, financial transactions, and any statements about building condition.'"
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Parties & Roles</label>
                  <textarea
                    placeholder="List main parties and their roles:
• John Smith (Buyer/Plaintiff)
• ABC Properties LLC (Seller/Defendant) 
• Mary Johnson (Real Estate Agent)
• Building Inspector Co. (Third Party)"
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    id="keyParties"
                    value={keyParties}
                    onChange={(e) => setKeyParties(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Analysis Instructions for Claude
                  </label>
                  <textarea
                    placeholder="Special instructions:
• Pay attention to dates around the inspection period
• Flag any communications about structural issues
• Note financial transaction timing
• Identify potential witness statements"
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    id="claudeInstructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Pro Tip:</h4>
                <p className="text-sm text-blue-800">
                  The more context you provide, the better Claude can identify legal significance, categorize events,
                  and ask relevant clarifying questions. Update this as your case develops.
                </p>
              </div>

              {/* Save button for case context */}
              {caseId && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {isSaving && "Saving..."}
                    {!isSaving && lastSaved && (
                      <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                    )}
                  </div>
                  <button
                    onClick={() => saveCaseContext(true)}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save Case Context'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Entry
            </button>

            <button
              onClick={() => exportChronology("full")}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Download size={20} />
              Export All
            </button>

            <button
              onClick={() => exportChronology("filtered")}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              <Filter size={20} />
              Export Filtered
            </button>

            <div className="text-sm text-gray-600 flex items-center gap-2">
              <FileText size={16} />
              {entries.length} total entries
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Parties</option>
              {getUniqueParties().map((party) => (
                <option key={party} value={party}>
                  {party}
                </option>
              ))}
            </select>

            <input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Document Analysis Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare size={20} />
            Claude Document Analysis
          </h3>

          <div className="space-y-4">
            {/* File Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <label htmlFor="fileInput" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-700">Upload Documents</span>
                  <p className="text-sm text-gray-500 mt-1">
                    EML, TXT, DOC, images, or other text-based litigation documents
                  </p>
                  <p className="text-xs text-amber-600 mt-1 font-medium">
                    ⚠️ PDFs: Copy/paste content below instead of uploading for better results
                  </p>
                  <input
                    id="fileInput"
                    type="file"
                    multiple
                    accept=".pdf,.eml,.txt,.doc,.docx,.png,.jpg,.jpeg,.gif,.msg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="mt-2 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Choose Files
                  </span>
                </label>
              </div>
            </div>

            {/* Manual Text Input */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">📝 Text Input (Best for PDFs):</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-green-800">
                  <strong>💡 Pro Tip for PDFs:</strong> Open your PDF, copy the relevant text content, and paste it
                  here. Claude will analyze the actual content instead of just the filename.
                </p>
              </div>
              <textarea
                placeholder="Paste PDF content, email text, or describe the event here. For PDFs: Copy the relevant sections (dates, parties, findings, violations, etc.) and paste here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                id="documentText"
              />
            </div>

            <textarea
              placeholder="Additional context (optional): Provide any background information that might help Claude understand the significance..."
              className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              id="userContext"
            />

            <button
              onClick={() => {
                const docText = (document.getElementById("documentText") as HTMLTextAreaElement)?.value || "";
                const context = (document.getElementById("userContext") as HTMLTextAreaElement)?.value || "";
                if (docText.trim()) {
                  analyzeWithClaude(docText, context);
                  const docTextEl = document.getElementById("documentText") as HTMLTextAreaElement;
                  const contextEl = document.getElementById("userContext") as HTMLTextAreaElement;
                  if (docTextEl) docTextEl.value = "";
                  if (contextEl) contextEl.value = "";
                } else {
                  alert("Please enter document text to analyze");
                }
              }}
              disabled={isClaudeProcessing}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {isClaudeProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload size={20} />
                  Analyze with Claude
                </>
              )}
            </button>

            {claudeResponse && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Claude Analysis:</h4>
                <pre className="text-sm text-blue-800 whitespace-pre-wrap">{claudeResponse}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Entry Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">{editingEntry ? "Edit" : "Add"} Chronology Entry</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parties Involved</label>
                <input
                  type="text"
                  placeholder="e.g., M. Edelman, K. Maloney"
                  value={formData.parties}
                  onChange={(e) => handleInputChange("parties", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
              <input
                type="text"
                placeholder="e.g., Email from M. Edelman to K. Maloney re: Contract Terms"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Factual Summary *</label>
              <textarea
                placeholder="Objective description of what occurred..."
                value={formData.summary}
                onChange={(e) => handleInputChange("summary", e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input
                type="text"
                placeholder="e.g., Email attachment, Deposition transcript p. 45"
                value={formData.source}
                onChange={(e) => handleInputChange("source", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Legal Significance</label>
              <textarea
                placeholder="Analysis of potential legal significance in the litigation..."
                value={formData.legalSignificance}
                onChange={(e) => handleInputChange("legalSignificance", e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Related Entries</label>
              <input
                type="text"
                placeholder="References to other chronology entries..."
                value={formData.relatedEntries}
                onChange={(e) => handleInputChange("relatedEntries", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={saveEntry} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                {editingEntry ? "Update" : "Save"} Entry
              </button>
              <button onClick={resetForm} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Chronology Entries */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Chronology Entries ({filteredEntries.length})</h3>
          </div>

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
                        <Calendar size={16} />
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
                      <button onClick={() => editEntry(entry)} className="text-gray-500 hover:text-blue-600">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => deleteEntry(entry.id)} className="text-gray-500 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2">{entry.title}</h4>

                  {entry.parties && (
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                      <Users size={14} />
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
                        <span>{expandedEntries.has(entry.id) ? "−" : "+"}</span>
                        <span>Legal Analysis & Related Entries</span>
                      </button>

                      {expandedEntries.has(entry.id) && (
                        <div className="space-y-3">
                          {entry.legalSignificance && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <h5 className="text-sm font-medium text-yellow-800 mb-1">Legal Significance:</h5>
                              <p className="text-sm text-yellow-700">{entry.legalSignificance}</p>
                            </div>
                          )}

                          {entry.relatedEntries && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <h5 className="text-sm font-medium text-blue-800 mb-1">Related Entries:</h5>
                              <p className="text-sm text-blue-700">{entry.relatedEntries}</p>
                            </div>
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
                              <FileText size={12} />
                              <span>{doc.filename}</span>
                              {idx < entry.documents!.length - 1 && <span className="text-gray-400">,</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span>
                      Created: {new Date(entry.createdAt).toLocaleDateString()}
                      {entry.updatedAt !== entry.createdAt &&
                        ` • Updated: ${new Date(entry.updatedAt).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LitigationChronologyManager;
