using Microsoft.Extensions.Caching.Memory;
using TaskCollaborationApp.API.Services.Interfaces;

namespace TaskCollaborationApp.API.Services
{
    /// <summary>
    /// Memory cache service implementation.
    /// Wraps IMemoryCache for Task caching with configurable TTL.
    /// </summary>
    public class CacheService : ICacheService
    {
        private readonly IMemoryCache _cache;
        private readonly TimeSpan _defaultTtl;

        public CacheService(IMemoryCache cache, IConfiguration configuration)
        {
            _cache = cache;
            var ttlMinutes = configuration.GetValue<int>("CacheSettings:TaskCacheTTLMinutes", 5);
            _defaultTtl = TimeSpan.FromMinutes(ttlMinutes);
        }

        /// <inheritdoc />
        public T? Get<T>(string key)
        {
            _cache.TryGetValue(key, out T? value);
            return value;
        }

        /// <inheritdoc />
        public void Set<T>(string key, T value, TimeSpan? ttl = null)
        {
            var options = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl ?? _defaultTtl
            };
            _cache.Set(key, value, options);
        }

        /// <inheritdoc />
        public void Remove(string key)
        {
            _cache.Remove(key);
        }
    }
}
