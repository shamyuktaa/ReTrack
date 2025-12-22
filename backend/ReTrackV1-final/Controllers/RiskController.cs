//namespace ReTrackV1.Controllers
//{
//    public class RiskController
//    {
//    }
//}

using Microsoft.AspNetCore.Mvc;
using ReTrackV1.Services;

[ApiController]
[Route("api/risk")]
public class RiskController : ControllerBase
{
    private readonly AnomalyDetectionService _service;

    public RiskController(AnomalyDetectionService service)
    {
        _service = service;
    }

    [HttpGet("scores")]
    public IActionResult GetRiskScores()
    {
        return Ok(_service.CalculateRiskScores());
    }
}