export default function StatCard({
  title,
  value,
  color = "white"
}: {
  title: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-[#1e293b] p-4 rounded-lg shadow text-center">
      <p className="text-gray-400">{title}</p>
      <h2 className="text-2xl font-bold" style={{ color }}>{value}</h2>
    </div>
  );
}
