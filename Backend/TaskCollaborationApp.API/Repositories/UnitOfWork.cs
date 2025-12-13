using Microsoft.EntityFrameworkCore.Storage;
using TaskCollaborationApp.API.Data;
using TaskCollaborationApp.API.Repositories.Interfaces;

namespace TaskCollaborationApp.API.Repositories
{
    /// <summary>
    /// Unit of Work implementation for managing transactions
    /// and coordinating repository operations.
    /// </summary>
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;
        private IDbContextTransaction? _transaction;

        public IUserRepository Users { get; }
        public ITaskRepository Tasks { get; }


        public UnitOfWork(
            ApplicationDbContext context,
            IUserRepository userRepository,
            ITaskRepository taskRepository)
        {
            _context = context;
            Users = userRepository;
            Tasks = taskRepository;
        }

        /// <inheritdoc />
        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        /// ACID Transaction Support (Banking-style "All or Nothing"):
        /// - Atomicity: All operations succeed or all fail together
        /// - Consistency: Database remains in valid state
        /// - Isolation: Transactions don't interfere with each other
        /// - Durability: Committed changes persist even after system failure

        /// Note: For simple single-table operations, just use SaveChangesAsync().
        /// Transaction methods are for complex multi-table operations where
        /// partial failure is unacceptable (e.g., money transfers).

        /// <inheritdoc />
        public async Task BeginTransactionAsync()
        {
            /// Begins a new database transaction (ACID).
            /// Use when multiple operations must succeed or fail together.
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        /// <inheritdoc />
        public async Task CommitAsync()
        {
            /// Commits the current transaction - makes all changes permanent.
            /// Call this after all operations in the transaction succeed.
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        /// <inheritdoc />
        public async Task RollbackAsync()
        {
            /// Rolls back the current transaction - cancels all changes.
            /// Call this if any operation in the transaction fails.
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        /// <inheritdoc />
        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}
