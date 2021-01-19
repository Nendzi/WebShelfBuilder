using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebShelfBuilder.Hubs
{
    /// <summary>
    /// Class uses for SignalR
    /// </summary>
    public class DesignAutomationHub : Hub
    {
        public string GetConnectionId() { return Context.ConnectionId; }
    }

}
