using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using TaskCollaborationApp.API.Data;
using TaskCollaborationApp.API.Repositories.Interfaces;

namespace TaskCollaborationApp.API.Repositories
{
    /// <summary>
    /// Generic repository implementation providing basic CRUD operations.
    /// Uses EF Core DbContext for data access.
    /// This is an abstract base class - must be inherited by specific repositories.
    /// </summary>
    /// <typeparam name="T">The entity type. (User, TaskItem)</typeparam>
    public abstract class Repository<T> : IRepository<T> where T : class
    {
        protected readonly ApplicationDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public Repository(ApplicationDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        /// <inheritdoc />
        public async Task<T?> GetByIdAsync(int id)
        {
            return await _dbSet.FindAsync(id);
        }

        /// <inheritdoc />
        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }

        /// <inheritdoc />
        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }

        /// <inheritdoc />
        public async Task AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
        }

        /// <inheritdoc />
        public Task DeleteAsync(T entity)
        {
            _dbSet.Remove(entity);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task EditAsync(T entity)
        {
            _dbSet.Update(entity);
            return Task.CompletedTask;
        }
    }
}