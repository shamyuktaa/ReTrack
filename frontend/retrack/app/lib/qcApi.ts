// GET PRODUCT BY ID

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

export async function getProductById(ProductId: string) {
  const res = await fetch(`${API_BASE_URL}/qc/task-product/${ProductId}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function fetchReportById(id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/qc/report/${id}`);
    return await res.json();
  } catch {
    return null;
  }
}

// SUBMIT QC REPORT  ✅ FIXED VERSION
export async function submitQCReport(report: any) {
  const payload = {
    ProductID: report.productId,      // FIX (backend expects ProductID)
    DefectType: report.defectType,
    Severity: report.severity,
    Notes: report.notes,
    FinalDecision: report.finalDecision,
    InspectorName: report.inspectorName,
    InspectionDate: report.inspectionDate
  };

  const res = await fetch(`${API_BASE_URL}/qc/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return await res.json();
}

// FETCH ALL QC REPORTS
export async function fetchAllReports() {
  const res = await fetch(`${API_BASE_URL}/qc/reports`);
  return res.ok ? await res.json() : [];
}

export async function fetchRiskScores() {
  const res = await fetch(`${API_BASE_URL}/api/risk/scores`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch risk scores");
  }
  return res.json();
}
