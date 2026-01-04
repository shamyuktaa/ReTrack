"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAllReports, fetchQCTasks } from "@/app/lib/qcApi";
import StatCard from "@/app/components/StatCard";
import RiskMeter from "../qc/components/RiskMeter";
import SuspiciousReturnCard from "./components/SuspiciousReturnCard";
import { fetchRiskScores } from "@/app/lib/qcApi";
import NotificationBell from "../components/NotificationBell";

type RiskScores = {
  customerRisk: number;
  agentRisk: number;
  warehouseRisk: number;
  systemRisk: number;
};

export default function QCDashboard() {
  const router = useRouter();

  // -------------------------------
  // ALL HOOKS STAY HERE (UNCONDITIONAL)
  // -------------------------------
  const [authorized, setAuthorized] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [searchId, setSearchId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [suspicious, setSuspicious] = useState<any[]>([]);
  const [risks, setRisks] = useState<RiskScores | null>(null);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------
  // 1. ROLE CHECK
  // -------------------------------
  useEffect(() => {
    const role = localStorage.getItem("role");
    setAuthorized(role === "QC" || role === "QCStaff");

  }, []);

  // -------------------------------
  // 2. LOAD REPORTS
  // -------------------------------
  useEffect(() => {
    if (!authorized) return;

    async function loadReports() {
      const data = await fetchAllReports();
      setReports(data);
      setFilteredReports(data);
    }
    loadReports();
  }, [authorized]);

  //-----------------------------------
  // 3. LOAD RISKS (MOVED UP)
  //-----------------------------------
  useEffect(() => {
    async function loadRisks() {
      try {
        const data = await fetchRiskScores();
        setRisks(data);
      } catch (err) {
        setError("Failed to load AI risk scores");
      }
    }
    loadRisks();
  }, []);

  // -------------------------------
  // 4. FILTERS (MOVED UP)
  // -------------------------------
  useEffect(() => {
    let updated = [...reports];

    if (searchId.trim() !== "") {
      updated = updated.filter((r) =>
r.ProductID?.toLowerCase().includes(searchId.toLowerCase())
      );
    }

    if (statusFilter !== "") {
      updated = updated.filter((r) => r.finalDecision === statusFilter);
    }

    setFilteredReports(updated);
  }, [searchId, statusFilter, reports]);

  // -------------------------------
  // CONDITIONAL RETURNS START HERE
  // -------------------------------
  
  // This value is computed using state, which is fine
  const riskScore = suspicious.length > 0 ? suspicious[0].score : 0; 
  
  if (!authorized) {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-gray-400">
      Checking authorization…
    </div>
  );
}

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!risks) {
    return <p className="text-gray-400">Loading AI risk analysis…</p>;
  }


  // -------------------------------
  // SUMMARY COUNTS
  // -------------------------------
  const total = reports.length;
  const approved = reports.filter((r) => r.finalDecision === "Approved").length;
  const rejected = reports.filter((r) => r.finalDecision === "Rejected").length;
  const rework = reports.filter((r) => r.finalDecision === "Needs Rework").length;

  // -------------------------------
  // UI STARTS HERE
  // -------------------------------
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
 <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 shadow-2xl sticky top-0 z-50 mb-8">
  <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
    <div className="flex items-center justify-between">

      {/* LEFT */}
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">QC Staff</h1>
          <p className="text-sm text-gray-500">Quality Control</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <NotificationBell role="QC"/>

      <button
  onClick={() => router.push("/qc/profile")}
  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold
cursor-pointer hover:bg-blue-500 transition-all duration-200"
>
  QC Staff
</button>


        <button
          onClick={() => {
            localStorage.clear();
            router.replace("/");
          }}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-white"
        >
          Logout
        </button>
      </div>

    </div>
  </div>
</header>

          <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        AI Risk Overview
      </h1>

      {/* ✅ ONLY 4 RISK METERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RiskMeter
          label="Customer Fraud Risk"
          value={risks.customerRisk}
        />

        <RiskMeter
          label="Agent Mishandling Risk"
          value={risks.agentRisk}
        />

        <RiskMeter
          label="Warehouse Handling Risk"
          value={risks.warehouseRisk}
        />

        <RiskMeter
          label="System Operational Risk"
          value={risks.systemRisk}
        />
      </div>

    </div>

        {/* <div className="mt-6">
  <h2 className="text-2xl font-bold mb-4">Suspicious Returns</h2>

  {suspicious.length === 0 ? (
    <p className="text-gray-400">No suspicious returns detected.</p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {suspicious.map((s, idx) => (
        <SuspiciousReturnCard key={idx} item={s} />
      ))}
    </div>
)}
</div> */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  {suspicious.map((s, idx) => (
    <SuspiciousReturnCard key={idx} item={s} />))}
</div>

      {/* TITLE */}
      <h1 className="text-3xl font-bold mb-8">QC Portal - Dashboard</h1>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Inspected" value={total} />
        <StatCard title="Approved" value={approved} color="#4ade80" />
        <StatCard title="Rejected" value={rejected} color="#f87171" />
        <StatCard title="Needs Rework" value={rework} color="#facc15" />
      </div>

      {/* FILTER BAR */}
      <div className="bg-[#1e293b] p-6 rounded-xl shadow border border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <input
            type="text"
            placeholder="Search Product ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="p-3 rounded bg-[#0f172a] border border-gray-600 text-white"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 rounded bg-[#0f172a] border border-gray-600 text-white"
          >
            <option value="">Status: All</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Needs Rework">Needs Rework</option>
          </select>

          <button
            onClick={() => router.push("/qc/control")}
            className="bg-blue-600 hover:bg-blue-500 rounded px-4 py-3"
          >
            
            + New QC Report
          </button>

          <button
            onClick={() => {
              setSearchId("");
              setStatusFilter("");
              setFilteredReports(reports);
            }}
            className="bg-gray-600 hover:bg-gray-500 rounded px-4 py-3"
          >
            Clear
          </button>
        </div>
      </div>

      {/* FINAL STATUS TABLE */}
      <div className="bg-[#1e293b] p-6 rounded-xl shadow border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Final Status and Reporting</h2>

        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-3">Product ID</th>
              <th className="p-3">Defect Type</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Final Decision</th>
              <th className="p-3">Inspector</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-400">
                  No reports found
                </td>
              </tr>
            ) : (
              filteredReports.map((r, idx) => (
                <tr
                  key={idx}
                  onClick={() => router.push(`/qc/report/${r.ProductID}`)}
                  className="cursor-pointer border-b border-gray-800 hover:bg-[#0f172a]"
                >
                  <td className="p-3">{r.ProductID}</td>
                  <td className="p-3">{r.defectType}</td>
                  <td className="p-3">{r.severity}</td>
                  <td className="p-3">{r.finalDecision}</td>
                  <td className="p-3">{r.inspectorName}</td>
                  <td className="p-3">
                    {new Date(r.inspectionDate).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}