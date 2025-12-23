// app/agent/scan/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

export default function ScanPage() {
  const router = useRouter();

  // Agent id read from localStorage (fallback to 5)
  const agentId =
    (typeof window !== "undefined"
      ? localStorage.getItem("userId") || localStorage.getItem("agentId")
      : null) || "5";


  const [returnId, setReturnId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifiedStatus, setVerifiedStatus] = useState<string | null>(null);

  useEffect(() => {
    setMessage(null);
    setError(null);
    setVerifiedStatus(null);
  }, [returnId]);

  async function readErrorText(res: Response) {
    try {
      const body = await res.text();
      try {
        const j = JSON.parse(body);
        return j?.message ?? j?.error ?? JSON.stringify(j);
      } catch {
        return body || `Server returned ${res.status}`;
      }
    } catch {
      return `Server returned ${res.status}`;
    }
  }

  // ===================== VERIFY PARCEL =====================
  async function verifyParcel() {
    setError(null);
    setMessage(null);
    setVerifiedStatus(null);

    const id = returnId.trim();
    if (!id) {
      setError("Please enter a Return ID (e.g. R033 or 16).");
      return;
    }

    setLoading(true);
    try {
      const identifier = encodeURIComponent(id);

      // ✅ FIX: agentId passed as QUERY PARAM (backend expects this)
      const url = `${API_BASE_URL}/api/Agent/returns/${identifier}/verify?agentId=${agentId}`;

      const res = await fetch(url, {
        method: "POST"
      });

      if (!res.ok) {
        const errTxt = await readErrorText(res);
        setError(errTxt);
        return;
      }

      const json = await res.json();
      const status = json?.status ?? "In Progress";

      setVerifiedStatus(status);
      setMessage(`Return ${id} verified — status set to "${status}"`);

      // Redirect back to dashboard so pickups refresh
      setTimeout(() => {
        window.location.href = "/agent";
      }, 700);

    } catch (err: any) {
      setError(err?.message ?? "Network error");
      console.error("verifyParcel error", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Scan Parcel</h2>

          <div className="mb-6">
            <div className="h-40 rounded-md border border-gray-700 bg-[#0b1720] flex items-center justify-center text-gray-500">
              Enter Return ID below
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Enter the Return ID (e.g. <code>R033</code> or <code>16</code>) and
              click <strong>Verify Parcel</strong>. This sets the return to{" "}
              <strong>In Progress</strong>.
            </p>
          </div>

          <label className="block text-sm text-gray-300 mb-2">
            Return ID *
          </label>
          <input
            value={returnId}
            onChange={(e) => setReturnId(e.target.value)}
            placeholder="Enter Return ID (e.g. R033 or 16)"
            className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white mb-4"
          />

          <div className="flex items-center gap-4">
            <button
              onClick={verifyParcel}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify Parcel"}
            </button>

            <button
              onClick={() => {
                setReturnId("");
                setMessage(null);
                setError(null);
                setVerifiedStatus(null);
              }}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white"
            >
              Clear
            </button>

            <button
              onClick={() => router.push("/agent")}
              className="ml-auto px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white"
            >
              Back to Dashboard
            </button>
          </div>

          {message && (
            <div className="mt-4 p-3 rounded-md bg-green-900/20 text-green-200 border border-green-700">
              {message}
            </div>
          )}

          {verifiedStatus && (
            <div className="mt-3 text-sm text-gray-300">
              Current status:{" "}
              <strong className="text-yellow-300">
                {verifiedStatus}
              </strong>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-900/20 text-red-200 border border-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500">
            Note: Verify sets the return status to{" "}
            <strong>In Progress</strong>. After verifying, assign the return to a
            bag in the Assigned Bags flow.
          </div>
        </div>
      </div>
    </div>
  );
}
