using Microsoft.AspNetCore.SignalR;

namespace ReTrackV1.Hubs
{
    public class NotificationHub : Hub
    {
        public async Task JoinRoleGroup(string role)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, role);
        }
    }
}