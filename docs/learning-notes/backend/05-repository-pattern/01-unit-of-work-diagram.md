# Unit of Work - Method Signature Connections

## UnitOfWork Method Connection Diagram

```mermaid
flowchart TB
    subgraph CLIENT["CLIENT (Caller)"]
        AuthService["AuthService<br/>─────────────<br/>-IUnitOfWork _unitOfWork"]
    end

    subgraph IDISPOSABLE["IDisposable (Interface)"]
        IDisposable_Dispose["void Dispose()"]
    end

    subgraph IUOW["IUnitOfWork (Interface)"]
        IUnitOfWork_Users["Users: IUserRepository { get; }"]
        IUnitOfWork_Save["Task‹int› SaveChangesAsync()"]
        IUnitOfWork_Begin["Task BeginTransactionAsync()"]
        IUnitOfWork_Commit["Task CommitAsync()"]
        IUnitOfWork_Rollback["Task RollbackAsync()"]
    end

    subgraph UOW["UnitOfWork (Implementation)"]
        UOW_Context["-ApplicationDbContext _context"]
        UOW_Transaction["-IDbContextTransaction? _transaction"]
        UOW_Users["+IUserRepository Users { get; }"]
        UOW_Save["+Task‹int› SaveChangesAsync()"]
        UOW_Begin["+Task BeginTransactionAsync()"]
        UOW_Commit["+Task CommitAsync()"]
        UOW_Rollback["+Task RollbackAsync()"]
        UOW_Dispose["+void Dispose()"]
    end

    subgraph EFCORE["EF CORE (Callee)"]
        DbContext_Save["_context.SaveChangesAsync()"]
        Database_Begin["_context.Database.BeginTransactionAsync()"]
        Transaction_Commit["_transaction.CommitAsync()"]
        Transaction_Rollback["_transaction.RollbackAsync()"]
        Transaction_Dispose["_transaction.DisposeAsync()"]
        Context_Dispose["_context.Dispose()"]
    end

    subgraph REPO["REPOSITORY"]
        IUserRepository["IUserRepository"]
    end

    %% IUnitOfWork extends IDisposable
    IUOW -.->|extends| IDISPOSABLE

    %% Client -> IUnitOfWork
    AuthService -->|_unitOfWork.Users| IUnitOfWork_Users
    AuthService -->|_unitOfWork.SaveChangesAsync| IUnitOfWork_Save
    AuthService -->|_unitOfWork.BeginTransactionAsync| IUnitOfWork_Begin
    AuthService -->|_unitOfWork.CommitAsync| IUnitOfWork_Commit
    AuthService -->|_unitOfWork.RollbackAsync| IUnitOfWork_Rollback

    %% IUnitOfWork -> UnitOfWork (implements)
    IUnitOfWork_Users -.->|implements| UOW_Users
    IUnitOfWork_Save -.->|implements| UOW_Save
    IUnitOfWork_Begin -.->|implements| UOW_Begin
    IUnitOfWork_Commit -.->|implements| UOW_Commit
    IUnitOfWork_Rollback -.->|implements| UOW_Rollback
    IDisposable_Dispose -.->|implements| UOW_Dispose

    %% UnitOfWork -> EF Core
    UOW_Save -->|calls| DbContext_Save
    UOW_Begin -->|calls| Database_Begin
    UOW_Commit -->|calls| Transaction_Commit
    UOW_Rollback -->|calls| Transaction_Rollback
    UOW_Dispose -->|calls| Transaction_Dispose
    UOW_Dispose -->|calls| Context_Dispose

    %% UnitOfWork -> Repository
    UOW_Users -->|returns| IUserRepository
```

## Call Flow Summary

```
AuthService
    │
    ├── _unitOfWork.Users ──────────────→ IUserRepository (Repository Access)
    │
    ├── _unitOfWork.SaveChangesAsync() ─→ _context.SaveChangesAsync() (Persist to DB)
    │
    ├── Transaction Methods:
    │   ├── BeginTransactionAsync() ────→ _context.Database.BeginTransactionAsync()
    │   ├── CommitAsync() ──────────────→ _transaction.CommitAsync()
    │   └── RollbackAsync() ────────────→ _transaction.RollbackAsync()
    │
    └── Dispose() (from IDisposable)
        ├── _transaction?.Dispose()
        └── _context.Dispose()
```

## Interface Inheritance

```
IDisposable          (System)
    │
    └── IUnitOfWork  (Our Interface)
            │
            └── UnitOfWork  (Our Implementation)
```

UnitOfWork must implement `Dispose()` because IUnitOfWork extends IDisposable.

## Legend

| Arrow | Meaning |
|-------|---------|
| `-->` | Method call |
| `-.->` | Implements / Extends |
| `-->│returns│` | Return value |
