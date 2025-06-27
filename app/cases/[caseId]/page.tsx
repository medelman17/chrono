"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import LitigationChronologyManager from "@/components/LitigationChronologyManager";
import { ChronologyEntry } from "@/types/chronology";

interface CaseData {
  id: string;
  name: string;
  description: string | null;
  context: string | null;
  keyParties: string | null;
  instructions: string | null;
  entries: ChronologyEntry[];
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await fetch(`/api/cases/${caseId}`);
        if (response.status === 401) {
          // User is not authenticated, redirect to sign in
          router.push('/sign-in');
          return;
        }
        if (!response.ok) throw new Error('Failed to fetch case');
        const data = await response.json();
        setCaseData(data);
      } catch (error) {
        console.error('Error fetching case:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCase();
  }, [caseId, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading case...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Case not found</h3>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Link>
          
          <Link
            href={`/cases/${caseId}/settings`}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Case Settings
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{caseData.name}</h1>
        <p className="text-gray-600">{caseData.description}</p>
      </div>

      {/* Pass case context to the chronology manager */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <LitigationChronologyManager 
          initialCaseContext={caseData.context || ""}
          initialKeyParties={caseData.keyParties || ""}
          initialInstructions={caseData.instructions || ""}
          caseId={caseId}
        />
      </div>
    </div>
  );
}