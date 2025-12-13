using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TaskCollaborationApp.API.Hubs
{
    /// <summary>
    /// TaskHub - SignalR Hub for real-time task notifications.
    /// Manages client connections to the TaskBoard group.
    /// </summary>
    [Authorize]
    public class TaskHub : Hub
    {
        private const string BoardGroup = "TaskBoard";

        /// <summary>
        /// Joins the TaskBoard group for receiving task updates.
        /// Called when client enters BoardPage.
        /// </summary>
        public async Task JoinBoard()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, BoardGroup);
        }

        /// <summary>
        /// Leaves the TaskBoard group.
        /// Called when client leaves BoardPage.
        /// </summary>
        public async Task LeaveBoard()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, BoardGroup);
        }

        /// <summary>
        /// Called when a client connects to the hub.
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Called when a client disconnects from the hub.
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}
