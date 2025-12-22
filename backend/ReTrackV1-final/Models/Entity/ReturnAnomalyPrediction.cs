using Microsoft.ML.Data;

namespace ReTrackV1.Models.Entity
{
    public class ReturnAnomalyPrediction
    {
        [ColumnName("PredictedLabel")]
        public bool IsAnomaly;

        public float Score;

    }
}
