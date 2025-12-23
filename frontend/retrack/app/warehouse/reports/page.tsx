"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

// Define the shape of the data based on your API response
interface IssueReport {
  id: number;
  issueID: string;
  bagId: number;
  bag: {
    bagCode: string;
  };
  returnId: number;
  return: {
    returnCode: string; // Not displayed, but good for context
  };
  type: string | null; // Note: 'type' is null in your sample data, but we'll use 'notes' as the "Type" displayed column
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  notes: string | null; // We will use this field for the 'Type' column
}

export default function IssueReports() {
  const router = useRouter();
  
  // State for storing the fetched issues
  const [issues, setIssues] = useState<IssueReport[]>([]);
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  // State for error handling
  const [error, setError] = useState<string | null>(null);

  // API Endpoint
  const API_URL = `${API_BASE_URL}/api/IssueReports`;

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch(API_URL);
        
        // Check for HTTP errors (e.g., 404, 500)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the JSON data
        const data: IssueReport[] = await response.json();
        
        // Update the state with the fetched data
        setIssues(data);
      } catch (err) {
        // Handle network errors or JSON parsing errors
        console.error("Failed to fetch issue reports:", err);
        setError("Failed to load data. Please check the API connection.");
      } finally {
        // Set loading to false regardless of success or failure
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, []); // The empty dependency array [] ensures this runs only once on mount

  // Helper function to determine the status class for styling
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "investigating":
        return "text-blue-400";
      default:
        return "text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header (No change) */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Issue Reports</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl"
          >
            Back
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Loading and Error States */}
        {isLoading && (
          <div className="text-center text-lg text-white">
            Loading issue reports...
          </div>
        )}

        {error && (
          <div className="text-center text-lg text-red-500">
            Error: {error}
          </div>
        )}

        {/* Display Table only if not loading and no error */}
        {!isLoading && !error && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800 text-center text-gray-300 uppercase tracking-wider">
                  <th className="p-4 text-left">Issue ID</th>
                  <th className="text-left">Bag ID</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {issues.length > 0 ? (
                  issues.map((issue) => (
                    <tr
                      key={issue.id}
                      className="border-b border-gray-800 hover:bg-gray-800/40 text-gray-100"
                    >
                      {/* Issue ID */}
                      <td className="p-4 font-mono text-sm text-left">{issue.issueID}</td>
                      
                      {/* Bag ID (using bagCode from nested object) */}
                      <td className="text-left">{issue.bag.bagCode}</td> 
                      
                      {/* Type (using notes field as 'type' is null in your data) */}
                      <td className="text-center">{issue.notes || 'N/A'}</td> 
                      
                      {/* Status */}
                      <td className={`text-center font-medium ${getStatusClass(issue.status)}`}>
                        {issue.status}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No issue reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}