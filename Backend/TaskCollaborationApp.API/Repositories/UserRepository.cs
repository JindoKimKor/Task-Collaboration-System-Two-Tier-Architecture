using Microsoft.EntityFrameworkCore;
using TaskCollaborationApp.API.Data;
using TaskCollaborationApp.API.Data.Entities;
using TaskCollaborationApp.API.Repositories.Interfaces;

namespace TaskCollaborationApp.API.Repositories
{
    /// <summary>
    /// User-specific repository implementation.
    /// Extends generic repository with authentication-related queries.
    /// </summary>
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(ApplicationDbContext context) : base(context)
        {
        }

        /// <inheritdoc />
        public async Task<User?> FindByEmailAsync(string email)
        {
            return await _dbSet
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        }

        /// <inheritdoc />
        public async Task<User?> FindByUsernameAsync(string username)
        {
            return await _dbSet
                .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
        }

        /// <inheritdoc />
        public async Task<User?> FindByEmailOrUsernameAsync(string emailOrUsername)
        {
            var value = emailOrUsername.ToLower();
            return await _dbSet
                .FirstOrDefaultAsync(u => u.Email.ToLower() == value || u.Username.ToLower() == value);
        }

        /// <inheritdoc />
        public async Task<bool> ExistsAsync(string email, string username)
        {
            return await _dbSet
                .AnyAsync(u => u.Email.ToLower() == email.ToLower() || u.Username.ToLower() == username.ToLower());
        }
    }
}