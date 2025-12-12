# AuthService - Method Signature Connections

## AuthService Method Connection Diagram

```mermaid
flowchart TB
    subgraph CLIENT["CLIENT (Caller)"]
        Controller["AuthController<br/>─────────────<br/>-IAuthService _authService"]
    end

    subgraph IAUTH["IAuthService (Interface)"]
        IAuth_Register["Task‹LoginResponseDto› RegisterAsync(RegisterRequestDto request)"]
    end

    subgraph AUTH["AuthService (Implementation)"]
        Auth_Fields["-IUnitOfWork _unitOfWork<br/>-IJwtService _jwtService<br/>-IConfiguration _configuration"]
        Auth_Register["+Task‹LoginResponseDto› RegisterAsync(RegisterRequestDto request)"]
    end

    subgraph DEPENDENCIES["Dependencies"]
        IUnitOfWork["IUnitOfWork<br/>─────────────<br/>+Users: IUserRepository<br/>+SaveChangesAsync()"]
        IJwtService["IJwtService<br/>─────────────<br/>+GenerateToken(User)"]
        IConfiguration["IConfiguration<br/>─────────────<br/>+AdminEmail"]
        BCrypt["BCrypt.Net.BCrypt<br/>─────────────<br/>+HashPassword()"]
    end

    subgraph DTO["DTOs"]
        RegisterRequestDto["RegisterRequestDto<br/>─────────────<br/>+Username<br/>+Email<br/>+Password"]
        LoginResponseDto["LoginResponseDto<br/>─────────────<br/>+Token<br/>+UserId<br/>+Username<br/>+Email<br/>+Role"]
    end

    %% Client -> IAuthService
    Controller -->|_authService.RegisterAsync| IAuth_Register

    %% IAuthService -> AuthService (implements)
    IAuth_Register -.->|implements| Auth_Register

    %% AuthService -> Dependencies
    Auth_Register -->|_unitOfWork.Users.ExistsAsync| IUnitOfWork
    Auth_Register -->|_unitOfWork.Users.AddAsync| IUnitOfWork
    Auth_Register -->|_unitOfWork.SaveChangesAsync| IUnitOfWork
    Auth_Register -->|_jwtService.GenerateToken| IJwtService
    Auth_Register -->|_configuration AdminEmail| IConfiguration
    Auth_Register -->|BCrypt.HashPassword| BCrypt

    %% DTO Flow
    Auth_Register -->|receives| RegisterRequestDto
    Auth_Register -->|returns| LoginResponseDto
```

---

## RegisterAsync Internal Flow

```mermaid
flowchart TD
    subgraph INPUT["Input"]
        Request["RegisterRequestDto<br/>───────────<br/>Username<br/>Email<br/>Password"]
    end

    subgraph STEP1["Step 1: Check Duplicates"]
        ExistsAsync["_unitOfWork.Users.ExistsAsync<br/>───────────<br/>email, username"]
        Check{exists?}
    end

    subgraph STEP2["Step 2: Hash Password"]
        HashPassword["BCrypt.HashPassword<br/>───────────<br/>request.Password"]
    end

    subgraph STEP3["Step 3: Determine Role"]
        GetAdminEmail["_configuration AdminEmail"]
        RoleCheck{email == adminEmail?}
        AdminRole["role = Admin"]
        UserRole["role = User"]
    end

    subgraph STEP4["Step 4: Create User"]
        CreateUser["new User<br/>───────────<br/>Username<br/>Email<br/>PasswordHash<br/>Role<br/>CreatedAt"]
    end

    subgraph STEP5["Step 5: Save to DB"]
        AddAsync["_unitOfWork.Users.AddAsync"]
        SaveAsync["_unitOfWork.SaveChangesAsync"]
    end

    subgraph STEP6["Step 6: Generate Token"]
        GenerateToken["_jwtService.GenerateToken<br/>───────────<br/>user"]
    end

    subgraph OUTPUT["Output"]
        Response["LoginResponseDto<br/>───────────<br/>Token<br/>UserId<br/>Username<br/>Email<br/>Role"]
    end

    Request --> ExistsAsync
    ExistsAsync --> Check
    Check -->|Yes| Exception["Throw InvalidOperationException"]
    Check -->|No| HashPassword
    HashPassword --> GetAdminEmail
    GetAdminEmail --> RoleCheck
    RoleCheck -->|Yes| AdminRole
    RoleCheck -->|No| UserRole
    AdminRole --> CreateUser
    UserRole --> CreateUser
    CreateUser --> AddAsync
    AddAsync --> SaveAsync
    SaveAsync --> GenerateToken
    GenerateToken --> Response
```

---

## Dependency Injection

```mermaid
flowchart LR
    subgraph DI["Program.cs (DI Registration)"]
        Register["AddScoped‹IAuthService, AuthService›()"]
    end

    subgraph CONSTRUCTOR["AuthService Constructor"]
        Params["AuthService(<br/>  IUnitOfWork unitOfWork,<br/>  IJwtService jwtService,<br/>  IConfiguration configuration<br/>)"]
    end

    subgraph FIELDS["Private Fields"]
        Field1["-_unitOfWork"]
        Field2["-_jwtService"]
        Field3["-_configuration"]
    end

    subgraph INJECTED["Injected Dependencies"]
        IUnitOfWork["IUnitOfWork"]
        IJwtService["IJwtService"]
        IConfiguration["IConfiguration"]
    end

    Register -.->|registers| CONSTRUCTOR
    IUnitOfWork -->|injected| Params
    IJwtService -->|injected| Params
    IConfiguration -->|injected| Params
    Params --> Field1
    Params --> Field2
    Params --> Field3
```

---

## Call Flow Summary

```
AuthController
    │
    └── _authService.RegisterAsync(RegisterRequestDto)
            │
            ├── Step 1: _unitOfWork.Users.ExistsAsync(email, username)
            │           └── Returns: bool
            │
            ├── Step 2: BCrypt.HashPassword(request.Password)
            │           └── Returns: string passwordHash
            │
            ├── Step 3: _configuration["AdminEmail"]
            │           └── Determine role: "Admin" or "User"
            │
            ├── Step 4: new User { ... }
            │
            ├── Step 5: _unitOfWork.Users.AddAsync(user)
            │           _unitOfWork.SaveChangesAsync()
            │
            ├── Step 6: _jwtService.GenerateToken(user)
            │           └── Returns: string token
            │
            └── Return: LoginResponseDto
```

---

## Legend

| Arrow | Meaning |
|-------|---------|
| `-->` | Method call / Uses |
| `-.->` | Implements / Registers |
