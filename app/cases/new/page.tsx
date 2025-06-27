"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewCasePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    keyParties: "",
    caseContext: "",
    instructions: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        // User is not authenticated, redirect to sign in
        router.push('/sign-in');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to create case');
      }

      const newCase = await response.json();
      
      // Redirect to the new case page
      router.push(`/cases/${newCase.id}`);
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Failed to create case. Please try again.');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <Link
          href="/cases"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cases
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Case</h1>
        <p className="text-gray-600">
          Set up a new litigation case for chronology management
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Case Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Smith v. Johnson Construction"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the case..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="keyParties"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Key Parties
              </label>
              <textarea
                id="keyParties"
                name="keyParties"
                rows={3}
                value={formData.keyParties}
                onChange={handleChange}
                placeholder="List the main parties involved (one per line)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                This helps Claude better analyze documents and identify relevant parties
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Case Context for AI Analysis
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="caseContext"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Case Background
              </label>
              <textarea
                id="caseContext"
                name="caseContext"
                rows={5}
                value={formData.caseContext}
                onChange={handleChange}
                placeholder="Provide background information about the case, key legal issues, relevant dates, etc..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                This context helps Claude provide more accurate document analysis
              </p>
            </div>

            <div>
              <label
                htmlFor="instructions"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Special Instructions for AI
              </label>
              <textarea
                id="instructions"
                name="instructions"
                rows={3}
                value={formData.instructions}
                onChange={handleChange}
                placeholder="Any specific instructions for document analysis (e.g., focus on contract terms, medical records, etc.)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="h-5 w-5" />
            Create Case
          </button>
          <Link
            href="/cases"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}