using ReTrackV1.Data;
using ReTrackV1.Models.Entity;

namespace ReTrackV1.Services
{
    public class QCService
    {
        public Product? GetProduct(string productId)

        {
            return ProductStore.Products.FirstOrDefault(p => p.ProductID == productId);
        }

        public bool SaveReport(QCReport report)
        {
            QCReportStore.Reports.Add(report);
            return true;
        }

        public List<QCReport> GetAllReports()
        {
            return QCReportStore.Reports;
        }
    }
}
