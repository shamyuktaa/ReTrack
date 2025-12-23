"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FiPhoneCall } from "react-icons/fi";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

type PickupRow = {
  returnId: string
  customerName: string
  customerPhone: string
  location: string
  pickupTime?: string | null
  pickupStatus?: string | null
  bagCode?: string | null
  status?: string
}

export default function AgentPage() {
  const router = useRouter()
  const [showReportModal, setShowReportModal] = useState<boolean>(false)
  const [isClient, setIsClient] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [reportReturnId, setReportReturnId] = useState<string>("")
  const [reportReason, setReportReason] = useState<string>("Customer not available")
  const [reportNote, setReportNote] = useState<string>("")
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false)

  // dashboard + pickups state
  const [summary, setSummary] = useState({ total: 0, completed: 0, inprogress: 0, pending: 0 })
  const [pickups, setPickups] = useState<PickupRow[]>([])
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingPickups, setLoadingPickups] = useState(true)

  // errors
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [pickupsError, setPickupsError] = useState<string | null>(null)

  // pagination state
  const [page, setPage] = useState<number>(1)
  const pageSize = 25
  const [totalPickups, setTotalPickups] = useState<number>(0)

  useEffect(() => {
    setIsClient(true)

    const timer = setTimeout(() => {
      const role = localStorage.getItem("role")
      if (role === "Agent" || role === "PickupAgent") {
        setIsAuthorized(true)
      } else {
        router.replace("/")
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [router])

  // read agent id from localStorage or fallback to "5"
  const agentId = (typeof window !== "undefined" ? (localStorage.getItem("userId") || localStorage.getItem("agentId")) : null)

  function mapStatus(rawStatus: string | undefined, bagCode: string | null) {
    const s = (rawStatus ?? "").toLowerCase().trim()

    if (bagCode) return "Bagged"
    if (s.includes("complete") || s.includes("completed") || s.includes("pickedup") || s.includes("picked")) return "Bagged"
    if (s.includes("fail") || s.includes("failed") || s.includes("reported") || s.includes("report")) return "Failed"
    if (s.includes("in progress") || s.includes("inprogress") || s.includes("scanned") || s.includes("verified") || s.includes("scanning")) return "In Progress"
    return "Pending"
  }

  async function readErrorText(res: Response) {
    try {
      const txt = await res.text()
      try {
        const j = JSON.parse(txt)
        return j?.message ?? j?.error ?? txt
      } catch {
        return txt || `Server returned ${res.status}`
      }
    } catch {
      return `Server returned ${res.status}`
    }
  }

  // ----------------- load summary -----------------
  async function loadSummary() {
    console.log("Fetching with Agent ID:", agentId, "URL:", URL)
    setLoadingSummary(true)
    setSummaryError(null)
    try {
      const url = `${API_BASE_URL}/api/Agent/${agentId}/summary`
      const res = await fetch(url)
      if (!res.ok) {
        const errTxt = await readErrorText(res)
        setSummaryError(`Summary fetch failed: ${errTxt}`)
        throw new Error("Failed to load summary")
      }
      const data = await res.json()
      setSummary({
        total: Number(data.total ?? 0),
        completed: Number(data.completed ?? 0),
        inprogress: Number(data.inprogress ?? data.inProgress ?? 0),
        pending: Number(data.pending ?? 0)
      })
    } catch (err: any) {
      console.error("Summary load error", err)
      if (!summaryError) setSummaryError(err?.message ?? "Network error")
    } finally {
      setLoadingSummary(false)
    }
  }

  // ----------------- load pickups -----------------
  async function loadPickups(p = page) {
    console.log("Fetching with Agent ID:", agentId, "URL:", URL)
    setLoadingPickups(true)
    setPickupsError(null)
    try {
      const url = `${API_BASE_URL}/api/Agent/${agentId}/pickups?page=${p}&pageSize=${pageSize}`
      const res = await fetch(url)
      if (!res.ok) {
        const errTxt = await readErrorText(res)
        setPickupsError(`Pickups fetch failed: ${errTxt}`)
        throw new Error("Failed to load pickups")
      }
      const data = await res.json()
      setTotalPickups(Number(data.total ?? 0))
      setPage(Number(data.page ?? p))

      const normalized = (data.items ?? []).map((r: any) => {
        const rawStatus = r.pickupStatus ?? r.PickupStatus ?? "Pending"
        const bagCode = r.bagCode ?? r.BagCode ?? null
        const displayStatus = mapStatus(rawStatus, bagCode)
        return {
          returnId: r.returnId ?? r.ExternalReturnCode ?? String(r.returnId ?? ""),
          customerName: r.customerName ?? r.CustomerName ?? "",
          customerPhone: r.customerPhone ?? r.CustomerPhone ?? "",
          location: r.location ?? r.Location ?? "",
          pickupTime: r.pickupTime ? new Date(r.pickupTime).toLocaleTimeString() : "-",
          pickupStatus: rawStatus,
          bagCode,
          status: displayStatus
        } as PickupRow
      })

      setPickups(normalized)
    } catch (err) {
      console.error("Pickups load error", err)
      if (!pickupsError) setPickupsError((err as any)?.message ?? "Failed to load pickups")
      setPickups([])
      setTotalPickups(0)
    } finally {
      setLoadingPickups(false)
    }
  }

  // initial load
  useEffect(() => {
    // console.log(10);
    if (!isAuthorized) return
    loadSummary()
    loadPickups(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, agentId])

  // page change
  useEffect(() => {
    if (!isAuthorized) return
    loadPickups(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  if (!isClient || !isAuthorized) return null

  const handleLogout = () => {
    localStorage.removeItem("role")
    localStorage.removeItem("userId")
    router.replace("/")
  }

  // ----------------- submit report -----------------
  async function submitReport() {
    if (!reportReturnId) {
      alert("Return ID missing")
      return
    }
    setReportSubmitting(true)
    try {
      const body = {
        reason: reportReason,
        note: reportNote,
        agentId: Number(agentId)
      }
      const res = await fetch(`${API_BASE_URL}/api/Agent/returns/${encodeURIComponent(reportReturnId)}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        console.error("Report failed", res.status, payload)
        alert("Report failed: " + (payload?.message ?? res.status))
        return
      }

      // success -> refresh counts and pickups for current page
      await loadSummary()
      await loadPickups(page)

      setShowReportModal(false)
      setReportNote("")
      setReportReason("Customer not available")
      alert("Report submitted — " + (payload?.newStatus ?? payload?.status ?? "updated"))
    } catch (err) {
      console.error("submitReport error", err)
      alert("Report failed: " + (err as Error).message)
    } finally {
      setReportSubmitting(false)
    }
  }

  // paging helpers
  const totalPages = Math.max(1, Math.ceil(totalPickups / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Header */} 
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">

          <div className="flex items-center space-x-4">
  <button
    onClick={() => router.push("/agent/profile")}
    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
  >
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  </button>

  <div>
    <h1 className="text-2xl font-bold text-white">Agent Portal</h1>
    <p className="text-sm text-gray-500">Pickup Management</p>
  </div>
</div>
            <div className="flex items-center space-x-4">
          

             <button
  onClick={() => router.push("/agent/profile")}
  className="w-20 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-semibold"
>
  Agent
</button>

              <div className="h-6 w-px bg-gray-700 mx-2"></div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition"
              >
                Logout
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">

        {/* Header row with refresh */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white mb-0 flex items-center">
            <span className="w-1 h-8 bg-blue-500 rounded-full mr-4"></span>
            Today's Overview
          </h2>

          <div className="flex items-center gap-3">
            <button onClick={() => { loadSummary(); loadPickups(page); }} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded">
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total Pickups</h3>
            <p className="text-4xl font-bold text-white">{loadingSummary ? "..." : summary.total}</p>
            <p className="text-gray-600 text-sm">Scheduled today</p>
          </div>
          <div className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Completed</h3>
            <p className="text-4xl font-bold text-blue-400">{loadingSummary ? "..." : summary.completed}</p>
            <p className="text-gray-600 text-sm">Successfully picked</p>
          </div>
          <div className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">In Progress</h3>
            <p className="text-4xl font-bold text-yellow-400">{loadingSummary ? "..." : summary.inprogress}</p>
            <p className="text-gray-600 text-sm">Currently active</p>
          </div>
          <div className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Pending</h3>
            <p className="text-4xl font-bold text-gray-400">{loadingSummary ? "..." : (summary.total - summary.completed - summary.inprogress)}</p>
            <p className="text-gray-600 text-sm">Awaiting pickup</p>
          </div>
        </div>

        {/* Show summary error if any */}
        {summaryError && (
          <div className="mb-4 p-3 rounded-md bg-red-900/20 text-red-200 border border-red-700">
            {summaryError}
          </div>
        )}

        {/* Pickups Table */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
            <span className="w-1 h-8 bg-blue-500 rounded-full mr-4"></span>
            Today's Pickups
            <span className="text-sm text-gray-400 ml-4">({totalPickups} total)</span>
          </h2>

          <div className="overflow-x-auto bg-gray-900 p-6 rounded-2xl border border-gray-800">
            {pickupsError && (
              <div className="mb-4 p-3 rounded-md bg-red-900/20 text-red-200 border border-red-700">
                {pickupsError}
              </div>
            )}

            {loadingPickups ? (
              <div className="text-gray-400">Loading pickups...</div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="py-3">Return ID</th>
                      <th className="py-3">Customer</th>
                      <th className="py-3">Location</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickups.map((r) => (
                      <tr key={r.returnId} className="border-b border-gray-800 text-white">
                        <td className="py-3">{r.returnId}</td>
                        <td>{r.customerName}</td>
                        <td>{r.location}</td>
                        <td>
                          <span className={`px-3 py-1 rounded-full text-sm ${statusBadgeClass(r.status as any)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 flex gap-3">
                          <button
                            className="flex items-center gap-2 text-emerald-500 hover:text-blue-300 text-xl"
                            onClick={() => { window.open(`tel:${r.customerPhone ?? ""}`, "_self") }}
                          >
                            Call <FiPhoneCall size={15}/>
                          </button>

                          <button
                            className="items-center text-blue-400 hover:text-blue-200"
                            onClick={() => {
                              setReportReturnId(r.returnId)
                              setReportReason("Customer not available")
                              setReportNote("")
                              setShowReportModal(true)
                            }}
                          >
                            Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination controls */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Page {page} of {totalPages}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => canPrev && setPage(p => Math.max(1, p - 1))}
                      disabled={!canPrev}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded disabled:opacity-50"
                    >
                      ← Prev
                    </button>

                    <button
                      onClick={() => canNext && setPage(p => Math.min(totalPages, p + 1))}
                      disabled={!canNext}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded disabled:opacity-50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* REPORT MODAL */}
        { showReportModal && (
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
            <div className="bg-gray-900 p-8 rounded-2xl w-[500px] border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Report Issue</h2>

              <label className="flex gap-2 text-gray-400">Return ID <div className="text-orange-600">*</div></label>
              <input
                value={reportReturnId}
                onChange={(e) => setReportReturnId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 px-4 py-2 rounded-xl mb-4"
                placeholder="Enter Return ID"
              />

              <label className="flex gap-2 text-gray-400">Reason <div className="text-orange-600">*</div></label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 px-4 py-2 rounded-xl mb-4"
              >
                <option>Customer not available</option>
                <option>Return ID not matched</option>
                <option>Product not matched </option>
                <option>Other</option>
              </select>

              <label className="flex gap-2 text-gray-400">Note</label>
              <textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 px-4 py-2 rounded-xl h-28 mb-4"
                placeholder="Optional details..."
              ></textarea>

              <div className="mt-6 flex justify-end gap-4">
                <button onClick={()=>setShowReportModal(false)} className="px-6 py-2 bg-gray-700 rounded-xl">
                  Cancel
                </button>
                <button onClick={submitReport} disabled={reportSubmitting} className="px-6 py-2 bg-blue-600 rounded-xl hover:bg-blue-700">
                  {reportSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-wrap gap-4 mt-10 mb-12">
          <button
            onClick={() => router.push("/agent/scan")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-lg"
          >
            Scan Parcel
          </button>

          <button
            onClick={() => router.push("/agent/bags")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-lg"
          >
            Assigned Bags
          </button>
        </div>

      </main>
    </div>
  )
}

/**
 * maps the display status to a badge CSS class
 */
function statusBadgeClass(status?: string) {
  const s = (status ?? "").toLowerCase()
  if (s === "bagged") return "bg-green-700/20 text-green-300 border border-green-700/40"
  if (s === "in progress" || s === "inprogress") return "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
  if (s === "failed") return "bg-red-700/20 text-red-300 border border-red-700/40"
  return "bg-blue-500/20 text-blue-300 border border-blue-500/40"
}
