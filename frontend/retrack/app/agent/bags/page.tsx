"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

interface Bag {
  bagId?: number
  bagCode: string
  status: string
}

interface BagItem {
  returnId: string
  productCategory: string
  customerName?: string
  customerPhone?: string
  expected: string
  status: string
}

interface BagDetail {
  bagId: number
  bagCode: string
  status: string
  sealIntegrity: string
  pickupAgentName: string
  warehouseLocation: string | number
  totalItems: number
  items: BagItem[]
}

export default function AgentBagsPage() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState(false)
  const [bags, setBags] = useState<Bag[]>([])
  const [selectedBag, setSelectedBag] = useState<BagDetail | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [assignMessage, setAssignMessage] = useState("")

  const [showSealConfirm, setShowSealConfirm] = useState(false)
  const [sealInProgress, setSealInProgress] = useState(false)

  // Add a state for the success message
const [successMessage, setSuccessMessage] = useState("");

// 1. Validation Logic
// This checks if the list is not empty AND every bag has the status "Sealed"
const areAllBagsSealed = bags.length > 0 && bags.every(b => (b.status === "Sealed" || b.status === "InWarehouse"));


  const agentId =
  typeof window !== "undefined"
    ? localStorage.getItem("userId")
    : null

  // ---------------- AUTH ----------------
  useEffect(() => {
    const role = localStorage.getItem("role")
    if (role === "Agent" || role === "PickupAgent") setAuthorized(true)
    else router.replace("/")
  }, [router])

  // ---------------- LOAD BAGS ----------------
  async function loadBags() {
    if (!agentId) return
    const res = await fetch(`${API_BASE_URL}/api/Agent/${agentId}/bags`)
    if (!res.ok) return
    const data: Bag[] = await res.json()
    setBags(data)
  }

  useEffect(() => {
    if (authorized) loadBags()
  }, [authorized])

  // ---------------- LOAD BAG DETAIL ----------------
  async function loadBagDetail(bagId: number) {
    setAssignMessage("")
    setSelectedBag(null)

    const res = await fetch(`${API_BASE_URL}/api/Agent/bags/${bagId}`)
    if (!res.ok) return

    const data = await res.json()

    const items: BagItem[] = (data.products ?? []).map((p: any) => ({
      returnId: p.returnId,
      productCategory: p.productCategory ?? "",
      customerName: p.customerName,
      customerPhone: p.customerPhone,
      expected: "Yes",
      status: p.status
    }))

    setSelectedBag({
      bagId: data.bagId,
      bagCode: data.bagCode,
      status: data.status ?? "Open",
      sealIntegrity: "",
      pickupAgentName: "",
      warehouseLocation: "",
      totalItems: items.length,
      items
    })
  }

  // ---------------- ASSIGN RETURN ----------------
  async function assignReturnToBag(bagId: number, returnId: string) {
    if (selectedBag?.status === "Sealed") return

    setAssigning(true)
    setAssignMessage("")

    try {
      const res = await fetch(`${API_BASE_URL}/api/Agent/bags/${bagId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnIdentifier: returnId })
      })

      const data = await res.json()

      if (!res.ok) {
        setAssignMessage(data?.message || "Assign failed")
        return
      }

      await loadBagDetail(bagId)
      await loadBags()
      setAssignMessage("Return successfully added to bag.")
    } finally {
      setAssigning(false)
    }
  }

  // ---------------- SEAL BAG ----------------
  async function doSealBag() {
    if (!selectedBag) return
    setSealInProgress(true)

    const res = await fetch(
      `${API_BASE_URL}/api/Agent/bags/${selectedBag.bagCode}/seal`,
      { method: "POST" }
    )

    if (res.ok) {
      await loadBags()
      await loadBagDetail(selectedBag.bagId)

      // ✅ ONLY REQUIRED ADDITION
      setSelectedBag(prev =>
        prev ? { ...prev, status: "Sealed" } : prev
      )

      setShowSealConfirm(false)
      setAssignMessage("Bag sealed successfully.")
    }
    setSealInProgress(false)
  }

  async function handleDeliverToWarehouse() {
  setSuccessMessage(""); // Reset message on new attempt
  const bagIds = bags.map(b => b.bagId);

  try {
    const res = await fetch(`${API_BASE_URL}/api/Agent/deliver-to-warehouse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bagIds)
    });

    if (res.ok) {
      setSuccessMessage("Bags were delivered to warehouse successfully!");
      //if (typeof fetchBags === "function") await fetchBags(); 
    }
  } catch (err) {
    console.error("Delivery failed", err);
  }
}

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <button
        onClick={() => router.push("/agent")}
        className="mb-6 bg-gray-800 text-white px-4 py-2 rounded-xl"
      >
        ← Back
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* BAG LIST */}
        <div className="bg-gray-900 p-6 rounded-xl">
          <div className="flex justify-between mb-4">
            <h2 className="text-white text-lg">Your Bags</h2>
            <button
              onClick={async () => {
                const res = await fetch(`${API_BASE_URL}/api/Agent/bags`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ pickupAgentId: Number(agentId) })
                })
                if (res.ok) loadBags()
              }}
              className="bg-blue-600 px-4 py-2 rounded text-white"
            >
              Create Bag
            </button>
          </div>

          {bags.map(b => (
            <div
              key={b.bagCode}
              onClick={() => loadBagDetail(b.bagId!)}
              className="flex justify-between items-center p-3 border-b border-gray-700 cursor-pointer"
            >
              <span className="text-white">{b.bagCode}</span>
              <div>
                {b.status !== "InWarehouse" && (
        <span
          className={`text-xs px-3 py-1 rounded-full ${
            b.status === "Sealed"
              ? "bg-red-600 text-white"
              : "bg-green-600 text-white"
          }`}
        >
          {b.status === "Sealed" ? "Sealed" : "Open"}
        </span>
      )}
      
      {/* Optional: Show a subtle indicator for InWarehouse bags */}
      {b.status === "InWarehouse" && (
        <span className="text-xs text-gray-500 italic">In Warehouse</span>
      )}
              </div>
            </div>
          ))}

          <div className="mt-6">
    <button 
      onClick={handleDeliverToWarehouse}
      disabled={!areAllBagsSealed} // Button is disabled if any bag is "Open"
      className={`w-full py-3 px-4 rounded-lg font-bold transition-colors ${
        areAllBagsSealed 
          ? "bg-blue-600 hover:bg-blue-700 text-white" 
          : "bg-gray-600 text-gray-400 cursor-not-allowed"
      }`}
    >
      Deliver Bags to Warehouse
    </button>

    {/* Display Success Message */}
    {successMessage && (
      <p className="text-green-400 text-center mt-3 animate-pulse">
        {successMessage}
      </p>
    )}

    {/* Optional: Helpful hint for the user */}
    {!areAllBagsSealed && bags.length > 0 && (
      <p className="text-xs text-gray-400 text-center mt-2">
        * All bags must be "Sealed" before delivery.
      </p>
    )}
  </div>
        </div>

        {/* BAG DETAILS */}
        <div className="bg-gray-900 p-6 rounded-xl">
          {!selectedBag && <p className="text-gray-400">Select a bag</p>}

          {selectedBag && (
            <>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-white text-xl">
                  Bag: {selectedBag.bagCode}
                </h2>

                {selectedBag.status !== "Sealed" && (
                  <button
                    onClick={() => setShowSealConfirm(true)}
                    className="bg-orange-600 px-4 py-2 rounded text-white"
                  >
                    Seal Bag
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-400 mb-4">
                Status:{" "}
                <span className="text-white font-medium">
                  {selectedBag.status === "Sealed" ? "Sealed" : "Open"}
                </span>
              </p>

              <div className="flex gap-2 mb-2">
                <input
                  id="assignInput"
                  disabled={selectedBag.status === "Sealed"}
                  className="flex-1 bg-gray-800 text-white p-2 rounded"
                  placeholder="Enter Return ID"
                />
                <button
                  disabled={assigning || selectedBag.status === "Sealed"}
                  onClick={() => {
                    const val = (
                      document.getElementById("assignInput") as HTMLInputElement
                    )?.value
                    if (val) assignReturnToBag(selectedBag.bagId, val)
                  }}
                  className="bg-green-600 px-4 py-2 rounded text-white"
                >
                  Assign
                </button>
              </div>

              {assignMessage && (
                <p className="text-sm mt-2 text-yellow-400">{assignMessage}</p>
              )}

              <h3 className="text-white mt-6 mb-2">
                Items ({selectedBag.totalItems})
              </h3>

              {selectedBag.items.map(it => (
                <div key={it.returnId} className="bg-gray-800 p-3 rounded mb-2">
                  <div className="text-white">Return ID: {it.returnId}</div>
                  <div className="text-gray-300">
                    Category: {it.productCategory}
                  </div>
                  <div className="text-gray-400">
                    Customer: {it.customerName}
                  </div>
                  <div className="text-gray-400">
                    Phone: {it.customerPhone}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* SEAL CONFIRM MODAL */}
      {showSealConfirm && selectedBag && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-xl w-100">
            <h3 className="text-white text-lg mb-3">Confirm Seal</h3>
            <p className="text-gray-400 mb-4">
              Sealing <b>{selectedBag.bagCode}</b> will prevent further
              assignments.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSealConfirm(false)}
                className="bg-gray-700 px-4 py-2 rounded text-white"
              >
                Cancel
              </button>
              <button
                disabled={sealInProgress}
                onClick={doSealBag}
                className="bg-orange-600 px-4 py-2 rounded text-white"
              >
                {sealInProgress ? "Sealing..." : "Confirm Seal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}