"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FolderOpen, Calendar, Users, ChevronRight, FileText } from "lucide-react";

interface Case {
  id: string;
  name: string;
  description: string | null;
  keyParties: string | null;
  createdAt: string;
  _count: {
    entries: number;
  };
}

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/cases');
      if (response.status === 401) {
        // User is not authenticated, Clerk middleware will redirect
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch cases');
      const data = await response.json();
      setCases(data);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(
    (case_) =>
      case_.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (case_.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (case_.keyParties?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const getParties = (keyParties: string | null): string[] => {
    if (!keyParties) return [];
    return keyParties.split('\n').filter((p: string) => p.trim()).slice(0, 3);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cases</h1>
        <p className="text-gray-600">Manage your litigation cases and chronologies</p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search cases by name, description, or parties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Link
          href="/cases/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Case
        </Link>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading cases...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Get started by creating your first case"}
            </p>
            {!searchTerm && (
              <Link
                href="/cases/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create First Case
              </Link>
            )}
          </div>
        ) : (
          filteredCases.map((case_) => {
            const parties = getParties(case_.keyParties);
            const totalParties = case_.keyParties ? case_.keyParties.split('\n').filter((p: string) => p.trim()).length : 0;
            
            return (
              <Link
                key={case_.id}
                href={`/cases/${case_.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {case_.name}
                      </h3>
                      <p className="text-gray-600">{case_.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created {new Date(case_.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{case_._count.entries} entries</span>
                    </div>
                    {case_.keyParties && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{totalParties} parties</span>
                      </div>
                    )}
                  </div>

                  {case_.keyParties && parties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {parties.map((party, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {party}
                        </span>
                      ))}
                      {totalParties > 3 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          +{totalParties - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}