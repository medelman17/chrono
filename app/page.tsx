"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { FileText, Shield, Clock, Users, ArrowRight, ChevronRight } from "lucide-react";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Litigation Chronology Manager
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your case management with AI-powered document analysis and chronology tracking
          </p>
          
          {isSignedIn ? (
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard/cases/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Create New Case
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Sign In
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Key Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <FileText className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Document Analysis</h3>
            <p className="text-gray-600">
              Automatically extract key information from legal documents using Claude AI
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Clock className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Timeline Management</h3>
            <p className="text-gray-600">
              Create and manage comprehensive chronologies for your litigation cases
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Shield className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure Storage</h3>
            <p className="text-gray-600">
              Enterprise-grade security with encrypted storage and user authentication
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Users className="h-12 w-12 text-orange-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
            <p className="text-gray-600">
              Share cases and collaborate with team members on complex litigation
            </p>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Create a Case</h3>
                  <p className="text-gray-600">
                    Start by creating a new case and providing context about your litigation matter
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upload Documents</h3>
                  <p className="text-gray-600">
                    Upload PDFs, emails, images, and other documents for AI-powered analysis
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Build Your Chronology</h3>
                  <p className="text-gray-600">
                    Review AI suggestions and build a comprehensive timeline of events
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Export and Share</h3>
                  <p className="text-gray-600">
                    Export your chronology in various formats and share with your team
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}