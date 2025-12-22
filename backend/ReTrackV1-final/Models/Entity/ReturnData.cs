using Microsoft.ML.Data;

namespace ReTrackV1.Models.Entity
{
    public class ReturnData
    {
        [LoadColumn(0)] public float Expected;
        [LoadColumn(1)] public float IsReported;
        [LoadColumn(2)] public float SealBroken;
        [LoadColumn(3)] public float IsInWarehouse;
        [LoadColumn(4)] public float WarehouseId;
    }
}
