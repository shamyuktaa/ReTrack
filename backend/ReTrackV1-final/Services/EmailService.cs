using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace ReTrackV1.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public void SendApprovalEmail(string toEmail, string userId, string password)
        {
            var emailSettings = _config.GetSection("EmailSettings");

            var smtpUsername = Environment.GetEnvironmentVariable("EMAIL_USERNAME");
            var smtpPassword = Environment.GetEnvironmentVariable("EMAIL_PASSWORD");

            if (string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
            {
                throw new InvalidOperationException("Email credentials are not configured in environment variables.");
            }

            var smtpClient = new SmtpClient(emailSettings["SmtpServer"])
            {
                Port = int.Parse(emailSettings["Port"]),
                Credentials = new NetworkCredential(smtpUsername, smtpPassword),
                EnableSsl = true
            };

            var message = new MailMessage
            {
                From = new MailAddress(
                    emailSettings["SenderEmail"],
                    emailSettings["SenderName"]
                ),
                Subject = "Your ReTrack Account Has Been Approved",
                Body = $@"
Hello,

Approved! Your ReTrack account has been approved and is now set to active.

User ID: {userId}
Password: {password}

Please log in to ReTrack continue!

Regards,
ReTrack Team
",
                IsBodyHtml = false
            };

            message.To.Add(toEmail);
            smtpClient.Send(message);
        }
    }
}
