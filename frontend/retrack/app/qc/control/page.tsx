"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProductById,
  submitQCReport,
  fetchQCTasks,
} from "@/app/lib/qcApi";

export default function QCControlPage() {
  const router = useRouter();

  // -----------------------
  // STATE
  // -----------------------
  const [authorized, setAuthorized] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [product, setProduct] = useState<any>(null);

  const [defectType, setDefectType] = useState("Cosmetic Damage");
  const [severity, setSeverity] = useState(50);
  const [notes, setNotes] = useState("");
  const [finalDecision, setFinalDecision] = useState("");

  // -----------------------
  // AUTH CHECK
  // -----------------------
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "QC" || role === "QCStaff") {
      setAuthorized(true);
    } else {
      router.replace("/");
    }
  }, [router]);

  // -----------------------
  // LOAD QC TASKS
  // -----------------------
  useEffect(() => {
    if (!authorized) return;

    async function loadTasks() {
      try {
        const data = await fetchQCTasks();
        setTasks(data);
      } catch (err) {
        console.error("Failed to load QC tasks", err);
      }
    }

    loadTasks();
  }, [authorized]);

  if (!authorized) return null;

  // -----------------------
  // LOAD PRODUCT
  // -----------------------
  async function loadProduct(pid: string) {
    const data = await getProductById(pid);
    if (!data) {
      alert("Product not found");
      return;
    }
    setProduct(data);
  }

  // -----------------------
  // SUBMIT REPORT
  // -----------------------
  async function handleSubmit() {
    if (!product) {
      alert("Select a product first");
      return;
    }

    const report = {
      productId: product.productID,
      defectType,
      severity,
      notes,
      finalDecision,
      inspectorName:
        localStorage.getItem("username") || "QC User",
      inspectionDate: new Date().toISOString(),
    };

    const result = await submitQCReport(report);

    if (result.success) {
      alert("Report submitted");
      router.push("/qc");
    } else {
      alert("Submission failed");
    }
  }

  // -----------------------
  // UI
  // -----------------------
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">

      <button
        className="bg-[#1e293b] px-4 py-2 rounded mb-6"
        onClick={() => router.push("/qc")}
      >
        ← Back to QC Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6">
        Product Quality Control
      </h1>

      {/* ✅ PRODUCT ID DROPDOWN (THIS IS WHAT YOU WANT) */}
      <div className="mb-8">
        <label className="block text-gray-400 mb-2">
          Product ID
        </label>

        <select
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            loadProduct(e.target.value);
          }}
          className="w-full p-3 rounded bg-[#1e293b] border border-gray-600"
        >
          <option value="">Select Product ID</option>
          {tasks.map((t) => (
            <option key={t.taskId} value={t.productId}>
              {t.productId}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT */}
        <div className="bg-[#1e293b] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">
            Product Details
          </h2>

          {product ? (
  <>
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded mb-4 border border-gray-600"
                  />
                )}

                <p><b>Name:</b> {product.name}</p>
                <p><b>Type:</b> {product.type}</p>
                <p><b>Description:</b> {product.description}</p>
              </>
            ) : (

            <p className="text-gray-400">
              Select a product to load details
            </p>
          )}
        </div>

        {/* RIGHT */}
        <div className="bg-[#1e293b] p-6 rounded-xl">
          <label>Defect Type</label>
          <select
            value={defectType}
            onChange={(e) => setDefectType(e.target.value)}
            className="w-full p-3 mb-4 bg-[#0f172a] border"
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
            onChange={(e) => setSeverity(+e.target.value)}
            className="w-full mb-4"
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="QC Notes"
            className="w-full h-28 p-3 mb-4 bg-[#0f172a] border"
          />

          <select
            value={finalDecision}
            onChange={(e) => setFinalDecision(e.target.value)}
            className="w-full p-3 mb-6 bg-[#0f172a] border"
          >
            <option value="">Final Decision</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Needs Rework</option>
          </select>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 py-3 rounded"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}