using Microsoft.AspNetCore.Mvc;
using ReTrackV1.Data;
using ReTrackV1.Models.Entity;

namespace ReTrackV1.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        // 🔔 Get notifications by role
        [HttpGet]
        public IActionResult GetNotifications([FromQuery] string role)
        {
            var notifications = _context.Notifications
                .Where(n => n.UserRole == role)
                .OrderByDescending(n => n.CreatedAt)
                .Take(10)
                .ToList();

            return Ok(notifications);
        }

        // ✔ Mark notification as read
        [HttpPut("{id}/read")]
        public IActionResult MarkAsRead(int id)
        {
            var notif = _context.Notifications.Find(id);
            if (notif == null) return NotFound();

            notif.IsRead = true;
            _context.SaveChanges();

            return Ok();
        }

        
    }
}