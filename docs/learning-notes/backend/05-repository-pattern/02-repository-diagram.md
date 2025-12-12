# Repository - Method Signature Connections

## IRepository‹T› Method Connections

```mermaid
flowchart LR
    subgraph NOTE["Note"]
        direction TB
        Note1["Repository‹T› is ABSTRACT"]
        Note2["Cannot be instantiated directly"]
        Note3["Not registered in DI"]
        Note4["Must be inherited by concrete class"]
    end

    subgraph INTERFACE["IRepository‹T› (Interface)"]
        direction TB
        IRepo_GetById["Task‹T?› GetByIdAsync(int id)"]
        IRepo_GetAll["Task‹IEnumerable‹T›› GetAllAsync()"]
        IRepo_Find["Task‹IEnumerable‹T›› FindAsync(predicate)"]
        IRepo_Add["Task AddAsync(T entity)"]
        IRepo_Delete["Task DeleteAsync(T entity)"]
        IRepo_Edit["Task EditAsync(T entity)"]
    end

    subgraph IMPL["Repository‹T› (Abstract - Base Class)"]
        direction TB
        Repo_Fields["#_context: ApplicationDbContext<br/>#_dbSet: DbSet‹T›"]
        Repo_GetById["+GetByIdAsync(id)"]
        Repo_GetAll["+GetAllAsync()"]
        Repo_Find["+FindAsync(predicate)"]
        Repo_Add["+AddAsync(entity)"]
        Repo_Delete["+DeleteAsync(entity)"]
        Repo_Edit["+EditAsync(entity)"]
    end

    subgraph EFCORE["DbSet‹T› Calls"]
        direction TB
        DbSet_Find["_dbSet.FindAsync(id)"]
        DbSet_ToList["_dbSet.ToListAsync()"]
        DbSet_Where["_dbSet.Where().ToListAsync()"]
        DbSet_Add["_dbSet.AddAsync(entity)"]
        DbSet_Remove["_dbSet.Remove(entity)"]
        DbSet_Update["_dbSet.Update(entity)"]
    end

    IRepo_GetById -.->|implements| Repo_GetById
    IRepo_GetAll -.->|implements| Repo_GetAll
    IRepo_Find -.->|implements| Repo_Find
    IRepo_Add -.->|implements| Repo_Add
    IRepo_Delete -.->|implements| Repo_Delete
    IRepo_Edit -.->|implements| Repo_Edit

    Repo_GetById -->|calls| DbSet_Find
    Repo_GetAll -->|calls| DbSet_ToList
    Repo_Find -->|calls| DbSet_Where
    Repo_Add -->|calls| DbSet_Add
    Repo_Delete -->|calls| DbSet_Remove
    Repo_Edit -->|calls| DbSet_Update
```

## IUserRepository Method Connections

```mermaid
flowchart LR
    subgraph DI["Program.cs (DI)"]
        direction TB
        DI_Register["AddScoped‹IUserRepository, UserRepository›()"]
    end

    subgraph UOW["IUnitOfWork"]
        direction TB
        UOW_Users["IUserRepository Users { get; }"]
    end

    subgraph INTERFACE["IUserRepository (Interface)"]
        direction TB
        IUser_ByEmail["Task‹User?› FindByEmailAsync(email)"]
        IUser_ByUsername["Task‹User?› FindByUsernameAsync(username)"]
        IUser_ByEmailOrUsername["Task‹User?› FindByEmailOrUsernameAsync(value)"]
        IUser_Exists["Task‹bool› ExistsAsync(email, username)"]
    end

    subgraph IMPL["UserRepository"]
        direction TB
        User_ByEmail["+FindByEmailAsync(email)"]
        User_ByUsername["+FindByUsernameAsync(username)"]
        User_ByEmailOrUsername["+FindByEmailOrUsernameAsync(value)"]
        User_Exists["+ExistsAsync(email, username)"]
    end

    subgraph EFCORE["DbSet‹User› Calls"]
        direction TB
        DbSet_FirstOrDefault1["_dbSet.FirstOrDefaultAsync(u => u.Email == email)"]
        DbSet_FirstOrDefault2["_dbSet.FirstOrDefaultAsync(u => u.Username == username)"]
        DbSet_FirstOrDefault3["_dbSet.FirstOrDefaultAsync(u => u.Email == v OR u.Username == v)"]
        DbSet_Any["_dbSet.AnyAsync(u => u.Email == email OR u.Username == username)"]
    end

    %% DI registers UserRepository as IUserRepository
    DI_Register -.->|registers| IMPL

    %% IUnitOfWork exposes IUserRepository
    UOW_Users -->|exposes| INTERFACE

    %% Interface -> Implementation
    IUser_ByEmail -.->|implements| User_ByEmail
    IUser_ByUsername -.->|implements| User_ByUsername
    IUser_ByEmailOrUsername -.->|implements| User_ByEmailOrUsername
    IUser_Exists -.->|implements| User_Exists

    %% Implementation -> EF Core
    User_ByEmail -->|calls| DbSet_FirstOrDefault1
    User_ByUsername -->|calls| DbSet_FirstOrDefault2
    User_ByEmailOrUsername -->|calls| DbSet_FirstOrDefault3
    User_Exists -->|calls| DbSet_Any
```

## Inheritance Structure

```mermaid
flowchart TB
    IRepository["IRepository‹T›<br/>─────────────<br/>«interface»"]
    IUserRepository["IUserRepository<br/>─────────────<br/>«interface»"]
    Repository["Repository‹T›<br/>─────────────<br/>«abstract»"]
    UserRepository["UserRepository"]

    IUserRepository -.->|extends| IRepository
    Repository -.->|implements| IRepository
    UserRepository -.->|implements| IUserRepository
    UserRepository -.->|extends| Repository
```

## Call Flow Summary

```
AuthService (via _unitOfWork.Users)
    │
    ├── IUserRepository Methods (User-specific):
    │   ├── FindByEmailAsync(email) ────────────→ _dbSet.FirstOrDefaultAsync(u => u.Email == email)
    │   ├── FindByUsernameAsync(username) ──────→ _dbSet.FirstOrDefaultAsync(u => u.Username == username)
    │   ├── FindByEmailOrUsernameAsync(value) ──→ _dbSet.FirstOrDefaultAsync(u => u.Email == value || u.Username == value)
    │   └── ExistsAsync(email, username) ───────→ _dbSet.AnyAsync(u => u.Email == email || u.Username == username)
    │
    └── IRepository‹User› Methods (Inherited from base):
        ├── GetByIdAsync(id) ───────────────────→ _dbSet.FindAsync(id)
        ├── GetAllAsync() ──────────────────────→ _dbSet.ToListAsync()
        ├── FindAsync(predicate) ───────────────→ _dbSet.Where(predicate).ToListAsync()
        ├── AddAsync(entity) ───────────────────→ _dbSet.AddAsync(entity)
        ├── DeleteAsync(entity) ────────────────→ _dbSet.Remove(entity)
        └── EditAsync(entity) ──────────────────→ _dbSet.Update(entity)
```

## Interface Inheritance

```
IRepository‹T›              (Generic CRUD Interface)
    │
    └── IUserRepository     (User-specific Interface, extends IRepository‹User›)

Repository‹T›               (Abstract Base Class, implements IRepository‹T›)
    │
    └── UserRepository      (Concrete Class, extends Repository‹User›, implements IUserRepository)
```

UserRepository has access to:
- Its own methods: `FindByEmailAsync`, `FindByUsernameAsync`, `FindByEmailOrUsernameAsync`, `ExistsAsync`
- Inherited methods from Repository‹T›: `GetByIdAsync`, `GetAllAsync`, `FindAsync`, `AddAsync`, `DeleteAsync`, `EditAsync`
- Inherited fields: `#_context`, `#_dbSet`

## Legend

| Arrow | Meaning |
|-------|---------|
| `-->` | Method call |
| `-.->` | Implements / Extends |
