namespace TaskCollaborationApp.API.Services.Interfaces
{
    /// <summary>
    /// Cache service contract.
    /// Provides abstraction over IMemoryCache for Task caching.
    /// Used for performance optimization with X-Cache header support.
    /// </summary>
    public interface ICacheService
    {
        /// <summary>
        /// Gets a cached item by key.
        /// Returns null if the key does not exist.
        /// </summary>
        /// <typeparam name="T">Type of cached value</typeparam>
        /// <param name="key">Cache key (e.g., "task_5")</param>
        /// <returns>Cached value or null</returns>
        T? Get<T>(string key);

        /// <summary>
        /// Sets a cached item with optional TTL.
        /// Default TTL is 5 minutes from configuration.
        /// </summary>
        /// <typeparam name="T">Type of value to cache</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="value">Value to cache</param>
        /// <param name="ttl">Time to live (optional)</param>
        void Set<T>(string key, T value, TimeSpan? ttl = null);

        /// <summary>
        /// Removes a cached item by key.
        /// Used for cache invalidation on updates/deletes.
        /// </summary>
        /// <param name="key">Cache key to remove</param>
        void Remove(string key);
    }
}
