using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace RetrackV1.Controllers
{
    [ApiController]
    [Route("secure")]
    public class SecureController : ControllerBase
    {
        [Authorize]
        [HttpGet]
        public IActionResult GetSecureData()
        {
            return Ok(new 
            { 
                message = "Authorized!", 
                user = User.Identity?.Name 
            });
        }
    }
}
