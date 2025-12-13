# Development Plan

## Task #54-55: NotificationService Implementation

### Overview
Implement NotificationService to send real-time notifications via SignalR when tasks are created, updated, or deleted.

### Implementation Steps

#### Task #54: Create NotificationService
1. **INotificationService.cs** - Interface definition
   - Path: `Services/Interfaces/INotificationService.cs`
   - Methods: NotifyTaskCreatedAsync, NotifyTaskUpdatedAsync, NotifyTaskDeletedAsync, NotifyTaskAssignedAsync

2. **NotificationService.cs** - Implementation
   - Path: `Services/NotificationService.cs`
   - Inject: IHubContext<TaskHub>
   - Use SendAsync to broadcast to "TaskBoard" group

3. **Program.cs** - DI Registration
   - AddScoped<INotificationService, NotificationService>()

#### Task #55: Integrate with TaskService
1. **TaskService.cs** - Add INotificationService dependency
2. **CreateTaskAsync** - Call NotifyTaskCreatedAsync after creation
3. **UpdateTaskAsync** - Call NotifyTaskUpdatedAsync after update
4. **DeleteTaskAsync** - Call NotifyTaskDeletedAsync after deletion

### Files Modified
- `Services/Interfaces/INotificationService.cs` (new)
- `Services/NotificationService.cs` (new)
- `Services/TaskService.cs` (modified)
- `Program.cs` (modified)
