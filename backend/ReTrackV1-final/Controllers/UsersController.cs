using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReTrackV1.Data;
using ReTrackV1.Models.DTO;
using ReTrackV1.Models.Entity;
using ReTrackV1.Services;
using System;
using System.Linq;

namespace ReTrackV1.Controllers
{
    // Admin route for managing users
    // URL: localhost:5001/api/users
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext DbContext;
        private readonly EmailService _emailService;

        public UsersController(AppDbContext DbContext, EmailService emailService)
        {
            this.DbContext = DbContext;
            _emailService = emailService;
        }

        // [GET] /api/users
        // Admin: View all users
        [HttpGet]
        public IActionResult GetUsers()
        {
            var allUsers = DbContext.Users.ToList();
            return Ok(allUsers);
        }

        // ============================
        // ✅ NEW: USER PROFILE ENDPOINT
        // ============================
        // [GET] /api/users/{userId}/profile
        // [GET] /api/users/{id}/profile
        // QC & Warehouse Profile
        [HttpGet("{userId}/profile")]
        public async Task<IActionResult> GetUserProfile(int userId)
        {
            var user = await DbContext.Users
                .Where(u => u.Id == userId)
                .Select(u => new
                {
                    id = u.Id,
                    name = u.Name,
                    email = u.Email,
                    phone = u.Phone,
                    role = u.Role,
                    city = u.City,
                    state = u.State,
                    address = u.Address,
                    shift = u.Shift,
                    warehouseId = u.WarehouseId,
                    status = u.Status,
                    createdAt = u.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }


        // [PUT] /api/users/{id}/status
        // Admin: Approve or Reject a candidate
        [HttpPut("{id}/status")]
        public IActionResult UpdateUserStatus(int id, [FromBody] UpdateUserStatusDto updateDto)
        {
            var userEntity = DbContext.Users.FirstOrDefault(u => u.Id == id);

            if (userEntity == null)
            {
                return NotFound($"User with ID {id} not found.");
            }

            userEntity.Status = updateDto.Status;
            userEntity.UpdatedAt = DateTime.UtcNow;

            if (updateDto.Status.Equals("Approved", StringComparison.OrdinalIgnoreCase))
            {
                if (userEntity.Role.Equals("WarehouseStaff", StringComparison.OrdinalIgnoreCase) ||
                    userEntity.Role.Equals("QCStaff", StringComparison.OrdinalIgnoreCase))
                {
                    userEntity.Shift = updateDto.Shift ?? "Morning";
                    userEntity.WarehouseId = updateDto.WarehouseId;
                }

                userEntity.EmploymentDate = DateOnly.FromDateTime(DateTime.UtcNow);
                userEntity.Status = "Active";

                if (string.IsNullOrEmpty(userEntity.UserId))
                {
                    userEntity.UserId = ApprovedUserDto.GeneratePublicId(userEntity.Role, userEntity.Id);
                    userEntity.PasswordHash = ApprovedUserDto.GeneratePublicId(userEntity.Role, userEntity.Id);

                    // Send approval email
                    _emailService.SendApprovalEmail(
                        userEntity.Email,
                        userEntity.UserId,
                        userEntity.PasswordHash
                    );

                }
            }
            else if (updateDto.Status.Equals("Rejected", StringComparison.OrdinalIgnoreCase))
            {
                // delete query
            }

            DbContext.Users.Update(userEntity);
            DbContext.SaveChanges();

            return Ok(new
            {
                message = $"User status successfully updated to {userEntity.Status}.",
                userId = userEntity.UserId,
                status = userEntity.Status,
                updatedAt = userEntity.UpdatedAt
            });
        }

        // [DELETE] /api/users/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            var userEntity = DbContext.Users.FirstOrDefault(u => u.Id == id);

            if (userEntity == null)
            {
                return NotFound($"User with ID {id} not found.");
            }

            var deletedUserDetails = new
            {
                message = $"User {userEntity.UserId} ({userEntity.Name}) successfully deleted.",
                id = userEntity.Id,
                userId = userEntity.UserId,
                name = userEntity.Name,
                role = userEntity.Role,
            };

            DbContext.Users.Remove(userEntity);
            DbContext.SaveChanges();
            return Ok(deletedUserDetails);
        }
    }
}
