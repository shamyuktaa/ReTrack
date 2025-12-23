"use client";
export default function SuspiciousReturnCard({ item }: any) {
  return (
    <div className="bg-[#1e293b] p-4 rounded-xl border border-gray-700">
      <h3 className="font-bold text-white">Potential Issue</h3>
      <p className="text-gray-300 text-sm mt-2">
        Expected: {item.expected === 1 ? "Yes" : "Missing"}
      </p>
      <p className="text-gray-300 text-sm">Reported: {item.reported === 1 ? "Yes" : "No"}</p>
      <p className="text-gray-300 text-sm">
        Seal Integrity: {item.sealBroken === 1 ? "Broken" : "Intact"}
      </p>
      <p className="text-gray-400 text-sm mt-2">Score: {item.score.toFixed(3)}</p>
    </div>
  );
}