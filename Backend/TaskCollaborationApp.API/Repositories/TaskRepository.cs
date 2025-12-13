using Microsoft.EntityFrameworkCore;
using TaskCollaborationApp.API.Data;
using TaskCollaborationApp.API.Data.Entities;
using TaskCollaborationApp.API.Repositories.Interfaces;
using TaskStatus = TaskCollaborationApp.API.Data.Entities.TaskStatus;

namespace TaskCollaborationApp.API.Repositories
{
    /// <summary>
    /// Task-specific repository implementation.
    /// Extends generic repository with pagination and filtering capabilities.
    /// </summary>
    public class TaskRepository : Repository<TaskItem>, ITaskRepository
    {
        public TaskRepository(ApplicationDbContext context) : base(context)
        {
        }

        /// <inheritdoc />
        public async Task<(IEnumerable<TaskItem> Items, int TotalCount)> GetPagedAsync(
            int page,
            int pageSize,
            TaskStatus? status = null,
            int? assignedToId = null,
            int? createdById = null,
            string? search = null,
            bool includeArchived = false)
        {
            var query = _dbSet
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .AsQueryable();

            // Filter: Archived tasks
            if (!includeArchived)
            {
                query = query.Where(t => !t.IsArchived);
            }

            // Filter: Status
            if (status.HasValue)
            {
                query = query.Where(t => t.Status == status.Value);
            }

            // Filter: Assigned to
            if (assignedToId.HasValue)
            {
                query = query.Where(t => t.AssignedToId == assignedToId.Value);
            }

            // Filter: Created by
            if (createdById.HasValue)
            {
                query = query.Where(t => t.CreatedById == createdById.Value);
            }

            // Filter: Search in title and description
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(t =>
                    t.Title.ToLower().Contains(searchLower) ||
                    (t.Description != null && t.Description.ToLower().Contains(searchLower)));
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .OrderByDescending(t => t.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        /// <inheritdoc />
        public async Task<TaskItem?> GetByIdWithDetailsAsync(int id)
        {
            return await _dbSet
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        /// <inheritdoc />
        public async Task<(IEnumerable<TaskItem> Items, int TotalCount)> GetByCreatorAsync(
            int userId, int page, int pageSize)
        {
            var query = _dbSet
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .Where(t => t.CreatedById == userId && !t.IsArchived);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(t => t.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        /// <inheritdoc />
        public async Task<(IEnumerable<TaskItem> Items, int TotalCount)> GetByAssigneeAsync(
            int userId, int page, int pageSize)
        {
            var query = _dbSet
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .Where(t => t.AssignedToId == userId && !t.IsArchived);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(t => t.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        /// <inheritdoc />
        public async Task<IEnumerable<TaskItem>> GetTasksToArchiveAsync()
        {
            var archiveThreshold = DateTime.UtcNow.AddSeconds(-5);

            return await _dbSet
                .Where(t => t.Status == TaskStatus.Done &&
                            !t.IsArchived &&
                            t.UpdatedAt < archiveThreshold)
                .ToListAsync();
        }
    }
}
