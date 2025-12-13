using TaskCollaborationApp.API.Repositories.Interfaces;

namespace TaskCollaborationApp.API.BackgroundServices
{
    /// <summary>
    /// Background service that automatically archives completed tasks after a delay.
    /// Runs every 2 seconds and archives tasks that have been Done for more than 5 seconds.
    /// </summary>
    public class TaskArchiveBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<TaskArchiveBackgroundService> _logger;
        private readonly int _intervalSeconds;
        private readonly int _delaySeconds;

        public TaskArchiveBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<TaskArchiveBackgroundService> logger,
            IConfiguration configuration)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _intervalSeconds = configuration.GetValue<int>("ArchiveSettings:IntervalSeconds", 2);
            _delaySeconds = configuration.GetValue<int>("ArchiveSettings:DelaySeconds", 5);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("TaskArchiveBackgroundService started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                    var tasksToArchive = await unitOfWork.Tasks.GetTasksToArchiveAsync();
                    var count = 0;

                    foreach (var task in tasksToArchive)
                    {
                        task.IsArchived = true;
                        task.ArchivedAt = DateTime.UtcNow;
                        _logger.LogInformation("Archived task {Id}: {Title}", task.Id, task.Title);
                        count++;
                    }

                    if (count > 0)
                    {
                        await unitOfWork.SaveChangesAsync();
                        _logger.LogDebug("Archived {Count} tasks", count);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error archiving tasks: {Message}", ex.Message);
                }

                await Task.Delay(_intervalSeconds * 1000, stoppingToken);
            }

            _logger.LogInformation("TaskArchiveBackgroundService stopped");
        }
    }
}
