"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProductById, submitQCReport } from "@/app/lib/qcApi";

export default function QCControlPage() {
  const router = useRouter();

  // ---------------------------------------
  // STATE
  // ---------------------------------------
  const [authorized, setAuthorized] = useState(false);

  const [productId, setProductId] = useState("");
  const [product, setProduct] = useState<any>(null);

  const [defectType, setDefectType] = useState("Cosmetic Damage");
  const [severity, setSeverity] = useState(50);
  const [notes, setNotes] = useState("");
  const [finalDecision, setFinalDecision] = useState("");

  // ---------------------------------------
  // ACCESS CONTROL
  // ---------------------------------------
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "QC") setAuthorized(true);
    else router.replace("/");
  }, [router]);

  if (!authorized) return null;

  // ---------------------------------------
  // LOAD PRODUCT
  // ---------------------------------------
  async function loadProduct() {
    const data = await getProductById(productId);

    if (!data) {
      alert("Product not found");
      return;
    }

    setProduct(data);
  }

  // ---------------------------------------
  // SUBMIT REPORT  (FINAL, FIXED)
  // ---------------------------------------
  async function handleSubmit() {
    if (!product) {
      alert("Load a product first");
      return;
    }

    const inspectorName = localStorage.getItem("username") || "QC User";

    const report = {
      productId: product.productID, // MUST BE LOWERCASE FOR BACKEND
      defectType,
      severity,
      notes,
      finalDecision,
      inspectorName,
      inspectionDate: new Date().toISOString(), // REQUIRED
    };

    console.log("Sending Report:", report); // Debug

    const result = await submitQCReport(report);

    if (result.success) {
      alert("Report Submitted!");
      router.push("/qc");
    } else {
      alert("Error submitting report");
    }
  }

  // ---------------------------------------
  // RESET
  // ---------------------------------------
  function resetForm() {
    setDefectType("Cosmetic Damage");
    setSeverity(50);
    setNotes("");
    setFinalDecision("");
  }

  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">

      <button
        className="bg-[#1e293b] px-4 py-2 rounded-md mb-6 hover:bg-[#24324a]"
        onClick={() => router.push("/qc")}
      >
        ← Back to QC Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6">Product Quality Control</h1>

      {/* PRODUCT SEARCH */}
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Enter Product ID (e.g., P1001)"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="flex-1 p-3 rounded bg-[#1e293b] border border-gray-600"
        />

        <button
          onClick={loadProduct}
          className="bg-blue-600 px-6 rounded hover:bg-blue-500"
        >
          Load Product
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT PANEL */}
        <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Product Details</h2>

          <div className="border border-gray-600 rounded-lg h-56 flex items-center justify-center mb-4">
            <p className="text-gray-400">No images uploaded</p>
          </div>

          {product ? (
            <div className="space-y-2">
              <p><strong>Name:</strong> {product.name}</p>
              <p><strong>Type:</strong> {product.type}</p>
              <p><strong>Description:</strong> {product.description}</p>
            </div>
          ) : (
            <p className="text-gray-400">Load a product ID to see details</p>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-6">QC Assessment</h2>

          <label>Defect Type</label>
          <select
            value={defectType}
            onChange={(e) => setDefectType(e.target.value)}
            className="w-full p-3 bg-[#0f172a] border border-gray-600 rounded mb-4"
          >
            <option>Cosmetic Damage</option>
            <option>Functional Issue</option>
            <option>Missing Parts</option>
            <option>Packaging Damage</option>
          </select>

          <label>Severity: {severity}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full mb-4"
          />

          <label>QC Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details..."
            className="w-full p-3 h-28 bg-[#0f172a] border border-gray-600 rounded mb-4"
          ></textarea>

          <label>Final Decision</label>
          <select
            value={finalDecision}
            onChange={(e) => setFinalDecision(e.target.value)}
            className="w-full p-3 bg-[#0f172a] border border-gray-600 rounded mb-6"
          >
            <option value="">Select Status</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Needs Rework">Needs Rework</option>
          </select>

          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 py-3 rounded hover:bg-blue-500"
            >
              Submit Report
            </button>

            <button
              onClick={resetForm}
              className="flex-1 bg-gray-600 py-3 rounded hover:bg-gray-500"
            >
              Reset Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
