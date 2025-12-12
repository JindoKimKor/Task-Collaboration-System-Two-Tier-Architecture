using System.Linq.Expressions;

namespace TaskCollaborationApp.API.Repositories.Interfaces
{
    /// <summary>
    /// Generic repository interface providing basic CRUD operations for any entity type.
    /// </summary>
    /// <typeparam name="T">The entity type. Must be a reference type (class, User and TaskItem).</typeparam>
    public interface IRepository<T> where T : class
    {
        /// <summary>
        /// Retrieves an entity by its unique identifier.
        /// </summary>
        /// <param name="id">The unique identifier of the entity.</param>
        /// <returns>The entity if found; otherwise, null.</returns>
        Task<T?> GetByIdAsync(int id);

        /// <summary>
        /// Retrieves all entities from the database.
        /// </summary>
        /// <returns>A collection of all entities.</returns>
        Task<IEnumerable<T>> GetAllAsync();

        /// <summary>
        /// Finds entities matching the specified condition.
        /// Uses Expression tree to enable SQL translation by EF Core.
        /// </summary>
        /// <param name="predicate">A lambda expression defining the filter condition.</param>
        /// <returns>A collection of entities matching the condition.</returns>
        /// <example>
        /// var activeUsers = await repo.FindAsync(u => u.IsActive == true);
        /// </example>
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

        /// <summary>
        /// Adds a new entity to the database.
        /// </summary>
        /// <param name="entity">The entity to add.</param>
        Task AddAsync(T entity);

        /// <summary>
        /// Deletes an existing entity from the database.
        /// </summary>
        /// <param name="entity">The entity to delete.</param>
        Task DeleteAsync(T entity);

        /// <summary>
        /// Updates an existing entity in the database.
        /// </summary>
        /// <param name="entity">The entity with updated values.</param>
        Task EditAsync(T entity);
    }
}