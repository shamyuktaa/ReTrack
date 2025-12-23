"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchReportById } from "@/app/lib/qcApi";

export default function QCReportPage({ params }: any) {
  const router = useRouter();
  const { id } = params;

  const [authorized, setAuthorized] = useState(false);
  const [report, setReport] = useState<any>(null);

  // ROLE PROTECTION
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "qc") setAuthorized(true);
    else router.replace("/");
  }, []);

  if (!authorized) return null;

  // LOAD REPORT DETAILS
  useEffect(() => {
    async function load() {
      const data = await fetchReportById(id);
      setReport(data);
    }
    load();
  }, [id]);

  if (!report)
    return (
      <div className="min-h-screen bg-[#0f172a] text-white p-6">
        <p>Loading report...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">

      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-6">QC Report Details</h1>

      {/* REPORT CARD */}
      <div className="bg-[#1e293b] p-6 rounded-lg shadow max-w-2xl">

        <h2 className="text-xl font-semibold mb-4">Product Information</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <p><span className="text-gray-400">Product ID:</span> {report.productID}</p>
          <p><span className="text-gray-400">Defect Type:</span> {report.defectType}</p>
          <p><span className="text-gray-400">Severity:</span> {report.severity}</p>
          <p><span className="text-gray-400">Final Decision:</span> {report.finalDecision}</p>
        </div>

        <h2 className="text-xl font-semibold mb-4">Inspection Details</h2>

        <p className="mb-2">
          <span className="text-gray-400">Inspector:</span> {report.inspectorName}
        </p>

        <p className="mb-4">
          <span className="text-gray-400">Date:</span>{" "}
          {new Date(report.inspectionDate).toLocaleString()}
        </p>

        <h2 className="text-xl font-semibold mb-4">Notes</h2>
        <p className="bg-[#0f172a] p-3 rounded-lg border border-gray-600">
          {report.notes}
        </p>
      </div>
    </div>
  );
}
