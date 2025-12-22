using Microsoft.ML;
using ReTrackV1.Data;
using ReTrackV1.Models.Entity;
using ReTrackV1.Models.DTO;

namespace ReTrackV1.Services
{
    public class AnomalyDetectionService
    {
        private readonly AppDbContext _db;

        public AnomalyDetectionService(AppDbContext db)
        {
            _db = db;
        }

        public RiskScoresDto CalculateRiskScores()
        {
            var anomalies = DetectSuspiciousReturns();

            // Safety check
            if (anomalies.Count == 0)
            {
                return new RiskScoresDto
                {
                    CustomerRisk = 0,
                    AgentRisk = 0,
                    WarehouseRisk = 0,
                    SystemRisk = 0
                };
            }

            float Normalize(IEnumerable<float> scores)
            {
                if (!scores.Any()) return 0;
                return MathF.Round(scores.Average() * 100, 2);
            }

            return new RiskScoresDto
            {
                CustomerRisk = Normalize(
                    anomalies
                        .Where(x => x.Data.IsReported == 1)
                        .Select(x => x.Score)
                ),

                AgentRisk = Normalize(
                    anomalies
                        .Where(x => x.Data.IsInWarehouse == 0)
                        .Select(x => x.Score)
                ),

                WarehouseRisk = Normalize(
                    anomalies
                        .Where(x => x.Data.SealBroken == 1)
                        .Select(x => x.Score)
                ),

                SystemRisk = Normalize(
                    anomalies.Select(x => x.Score)
                )
            };
        }

        public List<(ReturnData Data, bool IsAnomaly, float Score)> DetectSuspiciousReturns()
        {
            var ml = new MLContext(seed: 42);

            // Build ML-ready dataset
            // ✅ MATERIALIZE FIRST (prevents open DataReader issue)
            var bagItems = _db.BagItems.ToList();
            var bags = _db.Bags.ToList();

            var raw = (
                from bi in bagItems
                join b in bags on bi.BagId equals b.Id
                select new ReturnData
                {
                    Expected = bi.Expected == "Yes" ? 1f : 0f,
                    IsReported = bi.Status == "Report" ? 1f : 0f,
                    SealBroken = b.SealIntegrity == "Intact" ? 0f : 1f,
                    IsInWarehouse = b.Status == "InWarehouse" ? 1f : 0f,
                    WarehouseId = (float)(b.WarehouseId ?? 0)
                }
            ).ToList();



            // 🛑 SAFETY: PCA needs enough rows
            if (raw.Count < 10)
                return new();

            var data = ml.Data.LoadFromEnumerable(raw);

            // ✅ STABLE anomaly detection pipeline
            var pipeline = ml.Transforms
                .Concatenate(
                    "Features",
                    nameof(ReturnData.Expected),
                    nameof(ReturnData.IsReported),
                    nameof(ReturnData.SealBroken),
                    nameof(ReturnData.IsInWarehouse),
                    nameof(ReturnData.WarehouseId)
                )
                .Append(
                    ml.AnomalyDetection.Trainers.RandomizedPca(
                        featureColumnName: "Features",
                        rank: 2   // 🔥 FIXED (was 5)
                    )
                );

            var model = pipeline.Fit(data);
            var engine = ml.Model.CreatePredictionEngine<ReturnData, ReturnAnomalyPrediction>(model);

            var results = raw
                .Select(r =>
                {
                    var p = engine.Predict(r);
                    return (r, p.IsAnomaly, p.Score);
                })
                .OrderByDescending(x => x.Score)
                .ToList();

            return results;
        }
    }
}
