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

            float ScoreBand(float avg)
            {
                if (avg < 0.05f) return 25f;
                if (avg < 0.10f) return 45f;
                if (avg < 0.20f) return 65f;
                if (avg < 0.35f) return 80f;
                return 90f;
            }

            float Weighted(IEnumerable<float> scores, float weight)
            {
                if (!scores.Any()) return 20f * weight;
                return MathF.Round(ScoreBand(scores.Average()) * weight, 1);
            }

            return new RiskScoresDto
            {
                CustomerRisk = Weighted(
                    anomalies.Where(x => x.Data.IsReported == 1)
                             .Select(x => x.Score),
                    1.0f
                ),

                AgentRisk = Weighted(
                    anomalies.Where(x => x.Data.IsInWarehouse == 0)
                             .Select(x => x.Score),
                    0.9f
                ),

                WarehouseRisk = Weighted(
                    anomalies.Where(x => x.Data.SealBroken == 1)
                             .Select(x => x.Score),
                    0.8f
                ),

                SystemRisk = Weighted(
                    anomalies.Select(x => x.Score),
                    0.85f
                )
            };
        }

        // ====================================================
        // CORE ML LOGIC
        // ====================================================
        public List<(ReturnData Data, bool IsAnomaly, float Score)>
            DetectSuspiciousReturns()
        {
            var ml = new MLContext(seed: 42);

            // -----------------------------
            // MATERIALIZE DB DATA SAFELY
            // -----------------------------
            var bagItems = _db.BagItems.ToList();
            var bags = _db.Bags.ToList();

            var raw = (
                from bi in bagItems
                join b in bags on bi.BagId equals b.Id
                select new ReturnData
                {
                    Expected = bi.Expected != null &&
                               bi.Expected.Equals("Yes",
                                   StringComparison.OrdinalIgnoreCase)
                                   ? 1f : 0f,

                    IsReported = bi.Status != null &&
                                 bi.Status.Contains("Report",
                                     StringComparison.OrdinalIgnoreCase)
                                     ? 1f : 0f,

                    SealBroken = b.SealIntegrity != null &&
                                 !b.SealIntegrity.Equals("Intact",
                                     StringComparison.OrdinalIgnoreCase)
                                     ? 1f : 0f,

                    IsInWarehouse = b.Status != null &&
                                    b.Status.Contains("Warehouse",
                                        StringComparison.OrdinalIgnoreCase)
                                        ? 1f : 0f,

                    WarehouseId = (float)(b.WarehouseId ?? 0)
                }
            ).ToList();

            // -----------------------------
            // SAFETY CHECK (LOWERED THRESHOLD)
            // -----------------------------
            if (raw.Count < 3)
                return new();

            // -----------------------------
            // LOAD DATA
            // -----------------------------
            var data = ml.Data.LoadFromEnumerable(raw);

            // -----------------------------
            // PCA ANOMALY PIPELINE
            // -----------------------------
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
                        rank: 2
                    )
                );

            var model = pipeline.Fit(data);
            var engine =
                ml.Model.CreatePredictionEngine
                    <ReturnData, ReturnAnomalyPrediction>(model);

            // -----------------------------
            // RUN PREDICTIONS
            // -----------------------------
            var results = raw
                .Select(r =>
                {
                    var prediction = engine.Predict(r);
                    return (r, prediction.IsAnomaly, prediction.Score);
                })
                .OrderByDescending(x => x.Score)
                .ToList();

            return results;
        }
    }
}