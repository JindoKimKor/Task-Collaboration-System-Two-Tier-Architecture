namespace TaskCollaborationApp.API.Repositories.Interfaces
{
    /// <summary>
    /// Unit of Work pattern interface for managing transactions
    /// and coordinating repository operations.
    /// </summary>
    public interface IUnitOfWork : IDisposable
    {
        /// <summary>
        /// Gets the User repository instance.
        /// </summary>
        IUserRepository Users { get; }

        /// <summary>
        /// Persists all pending changes to the database.
        /// </summary>
        Task<int> SaveChangesAsync();

        /// <summary>
        /// Begins a new database transaction.
        /// </summary>
        Task BeginTransactionAsync();

        /// <summary>
        /// Commits the current transaction.
        /// </summary>
        Task CommitAsync();

        /// <summary>
        /// Rolls back the current transaction.
        /// </summary>
        Task RollbackAsync();
    }
}