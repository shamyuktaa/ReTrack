
"use client";

type RiskMeterProps = {
  label: string;
  value: number;
};

export default function RiskMeter({ label, value }: RiskMeterProps) {
  const safeValue = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <p className="text-sm text-gray-300 mb-1">{label}</p>

      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full bg-red-500 transition-all duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 mt-1 text-right">
        {safeValue}%
      </p>
    </div>
  );
}