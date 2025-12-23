"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, X, CheckCircle, MapPin, User, Package, ArrowUpDown, Bell, LogOut } from "lucide-react"

interface OrderItem {
  id: string
  returnId: string
  productType: string
  condition: string
  status: "pending" | "reported" | "approved"
}

export default function WarehouseStaffModule() {
  // core states
  const [bagId, setBagId] = useState<string>("BAG-001-A")
  const [manualInput, setManualInput] = useState<string>("")
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false)
  const [showReportModal, setShowReportModal] = useState<boolean>(false)
  const [showQcModal, setShowQcModal] = useState<boolean>(false)

  // camera
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // table and sorting
  const [sortProduct, setSortProduct] = useState(false)
  const [sortStatus, setSortStatus] = useState(false)
  const [reportSubmittedMsg, setReportSubmittedMsg] = useState<string | null>(null)

  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: "1", returnId: "RET001", productType: "Electronics", condition: "Good", status: "pending" },
    { id: "2", returnId: "RET002", productType: "Apparel", condition: "Damaged", status: "reported" },
    { id: "3", returnId: "RET003", productType: "Home Goods", condition: "Good", status: "pending" },
    { id: "4", returnId: "RET004", productType: "Books", condition: "Fair", status: "pending" },
    { id: "5", returnId: "RET005", productType: "Electronics", condition: "Good", status: "pending" },
  ])

  // react effect: stop camera on unmount or modal close
  useEffect(() => {
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // start camera when requested
  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setCameraStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch (err) {
      console.error("camera error", err)
      alert("Unable to access camera. Allow camera permissions or use manual entry.")
    }
  }

  const stopCamera = () => {
    if (!cameraStream) return
    cameraStream.getTracks().forEach((t) => t.stop())
    setCameraStream(null)
  }

  const openCamera = async () => {
    setShowCameraModal(true)
    await startCamera()
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return
    const v = videoRef.current
    const c = canvasRef.current
    c.width = v.videoWidth || 1280
    c.height = v.videoHeight || 720
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.drawImage(v, 0, 0, c.width, c.height)

    // For demo: generate bag id from timestamp
    const newBagId = `BAG-${Date.now().toString().slice(-6)}`
    setBagId(newBagId)

    // stop camera and close modal
    stopCamera()
    setShowCameraModal(false)
    setManualInput("")
  }

  const closeCameraModal = () => {
    stopCamera()
    setShowCameraModal(false)
    setManualInput("")
  }

  // Scan Bag logic (if manual input present use it, else open camera)
  const handleScanBag = () => {
    if (manualInput.trim()) {
      setBagId(manualInput.trim())
      setManualInput("")
    } else {
      openCamera()
    }
  }

  // Sorting helpers
  const getSortedItems = () => {
    const arr = [...orderItems]
    if (sortProduct) arr.sort((a, b) => a.productType.localeCompare(b.productType))
    if (sortStatus) arr.sort((a, b) => a.status.localeCompare(b.status))
    return arr
  }

  // Status helper (simple light style classes)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700"
      case "reported":
        return "text-xs px-2 py-1 rounded-full bg-red-50 text-red-700"
      case "approved":
        return "text-xs px-2 py-1 rounded-full bg-green-50 text-green-700"
      default:
        return "text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700"
    }
  }

  // Logout -> redirect to root (as requested)
  const handleLogout = () => {
    window.location.href = "/"
  }

  /**
   * Report Issue modal state & submit
   * Fields: bagId (required), productId (optional), issueText (required)
   */
  const [reportBagId, setReportBagId] = useState<string>(bagId)
  useEffect(() => {
    // keep reportBagId in sync when bagId changes and modal is not open
    if (!showReportModal) setReportBagId(bagId)
  }, [bagId, showReportModal])

  const [reportProductId, setReportProductId] = useState<string>("")
  const [reportIssueText, setReportIssueText] = useState<string>("")
  const [reportError, setReportError] = useState<string | null>(null)
  const submitReportIssue = () => {
    // validation
    if (!reportBagId.trim()) {
      setReportError("Bag ID is required.")
      return
    }
    if (!reportIssueText.trim()) {
      setReportError("Issue description is required.")
      return
    }
    // simulate submit (could call API)
    setReportError(null)
    setShowReportModal(false)
    setReportProductId("")
    setReportIssueText("")
    setReportBagId(bagId) // reset
    setReportSubmittedMsg("Issue reported successfully.")
    setTimeout(() => setReportSubmittedMsg(null), 3000)
  }

  // Prepare QC modal: show message, submit or cancel
  const [qcSubmitting, setQcSubmitting] = useState(false)
  const submitPrepareQc = () => {
    setQcSubmitting(true)
    // simulate API delay
    setTimeout(() => {
      setQcSubmitting(false)
      setShowQcModal(false)
      // show message
      setReportSubmittedMsg("Bag moved for Quality Check — Report submitted.")
      setTimeout(() => setReportSubmittedMsg(null), 3000)
    }, 900)
  }

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Top header */}
      <div className="w-full border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-semibold">ReTrack - Warehouse staff</div>
          </div>

          <div className="flex items-center gap-3">
            <button aria-label="notifications" className="p-2 rounded hover:bg-gray-100">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button aria-label="profile" className="p-2 rounded hover:bg-gray-100">
              <User className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Scan Incoming Bag */}
        <div className="p-4 rounded-md border border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Enter or scan Bag ID</label>
              <input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScanBag()}
                placeholder="Bag ID (e.g., BAG-001-A)"
                className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleScanBag}
                className="px-4 py-2 bg-blue-600 text-white rounded"
                title="Scan (opens camera if no manual input)"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span>Scan Bag</span>
                </div>
              </button>

              
            </div>
          </div>

          {/* <div className="mt-3 text-sm text-gray-600 text-right">
            Bag ID:&nbsp;
            <span className="font-medium text-gray-900">{bagId}</span>
          </div> */}
        </div>

        {/* Main grid: details + table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bag details (left) */}
          <div className="p-4 border border-gray-200 rounded bg-white">
            <h4 className="text-base font-semibold mb-3">Bag Details</h4>

            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <div className="text-xs text-gray-500">Bag ID</div>
                <div className="font-medium">{bagId}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Status</div>
                <div className="font-medium flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" /> In Warehouse
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Total Items</div>
                <div className="font-medium">{orderItems.length}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Location</div>
                <div className="font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  WH-Section B3
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Pickup Agent</div>
                <div className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Agent Sarah K.
                </div>
              </div>
            </div>
          </div>

          {/* Orders list (right - spans 2 columns) */}
          <div className="lg:col-span-2 p-4 border border-gray-200 rounded bg-white">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold">Order List</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortProduct(!sortProduct)}
                  className={`px-3 py-1 text-sm rounded border ${sortProduct ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}
                >
                  <div className="flex items-center gap-2"><ArrowUpDown className="w-4 h-4" /> Sort Product</div>
                </button>
                <button
                  onClick={() => setSortStatus(!sortStatus)}
                  className={`px-3 py-1 text-sm rounded border ${sortStatus ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}
                >
                  <div className="flex items-center gap-2"><ArrowUpDown className="w-4 h-4" /> Sort Status</div>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="py-2 px-3 text-xs text-gray-500">Return ID</th>
                    <th className="py-2 px-3 text-xs text-gray-500">Product Type</th>
                    <th className="py-2 px-3 text-xs text-gray-500">Condition</th>
                    <th className="py-2 px-3 text-xs text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedItems().map((it) => (
                    <tr key={it.id} className="border-b last:border-b-0">
                      <td className="py-3 px-3">{it.returnId}</td>
                      <td className="py-3 px-3">{it.productType}</td>
                      <td className="py-3 px-3">{it.condition}</td>
                      <td className="py-3 px-3">
                        <span className={getStatusBadge(it.status)}>{it.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* actions */}
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowReportModal(true)} className="px-3 py-2 border border-gray-200 rounded">Report Issue</button>
              <button onClick={() => setShowQcModal(true)} className="px-3 py-2 bg-green-600 text-white rounded">Prepare Bag for QC</button>
            </div>
          </div>
        </div>

        {/* transient message area */}
        {reportSubmittedMsg && (
          <div className="p-3 bg-green-50 border border-green-100 text-green-800 rounded text-sm">
            {reportSubmittedMsg}
          </div>
        )}
      </div>

      {/* --------------------- Camera Modal --------------------- */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-md border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="text-lg font-medium">Scan Bag ID</div>
              <button onClick={closeCameraModal} className="p-2 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-black rounded overflow-hidden aspect-video mb-3">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </div>

              <div className="flex gap-2">
                <button onClick={captureImage} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded">📷 Capture Image</button>
                <button onClick={closeCameraModal} className="flex-1 px-4 py-2 border border-gray-200 rounded">Close</button>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                Or enter Bag ID manually:
                <input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter Bag ID or Return ID"
                  className="mt-2 w-full px-3 py-2 border border-gray-200 rounded"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (manualInput.trim()) {
                        setBagId(manualInput.trim())
                        setManualInput("")
                        closeCameraModal()
                      }
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded"
                  >
                    Add Item
                  </button>
                  <button onClick={closeCameraModal} className="px-3 py-2 border border-gray-200 rounded">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------- Report Issue Modal --------------------- */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-md border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="text-lg font-medium">Report Issue</div>
              <button onClick={() => setShowReportModal(false)} className="p-2 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bag ID (required)</label>
                <input
                  value={reportBagId}
                  onChange={(e) => setReportBagId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Product ID (optional)</label>
                <input
                  value={reportProductId}
                  onChange={(e) => setReportProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Mention Issue (required)</label>
                <textarea
                  value={reportIssueText}
                  onChange={(e) => setReportIssueText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded"
                />
              </div>

              {reportError && <div className="text-sm text-red-600">{reportError}</div>}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // reset and close
                    setReportBagId(bagId)
                    setReportProductId("")
                    setReportIssueText("")
                    setReportError(null)
                    setShowReportModal(false)
                  }}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={submitReportIssue}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                  disabled={!reportBagId.trim() || !reportIssueText.trim()}
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------- Prepare QC Modal --------------------- */}
      {showQcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-md border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-lg font-medium">Prepare Bag for QC</div>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-sm text-gray-700">Bag ID: <span className="font-medium">{bagId}</span></div>
              <div className="text-sm text-gray-700">Bag moved for Quality Check</div>

              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowQcModal(false)} className="flex-1 px-3 py-2 border border-gray-200 rounded">Cancel</button>
                <button
                  onClick={submitPrepareQc}
                  disabled={qcSubmitting}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded"
                >
                  {qcSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
