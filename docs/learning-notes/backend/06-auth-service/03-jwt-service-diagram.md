# JwtService - Method Signature Connections

## JwtService Method Connection Diagram

```mermaid
flowchart TB
    subgraph CLIENT["CLIENT (Caller)"]
        AuthService["AuthService<br/>─────────────<br/>-IJwtService _jwtService"]
    end

    subgraph IJWT["IJwtService (Interface)"]
        IJwt_Generate["string GenerateToken(User user)"]
    end

    subgraph JWT["JwtService (Implementation)"]
        Jwt_Fields["-JwtSettings _jwtSettings"]
        Jwt_Generate["+string GenerateToken(User user)"]
    end

    subgraph ENTITY["Entity"]
        User["User<br/>───────────<br/>+Id<br/>+Email<br/>+Username<br/>+Role"]
    end

    %% Client -> IJwtService
    AuthService -->|_jwtService.GenerateToken| IJwt_Generate

    %% IJwtService -> JwtService (implements)
    IJwt_Generate -.->|implements| Jwt_Generate

    %% Entity input
    Jwt_Generate -->|receives| User
```

---

## JwtService Dependencies

```mermaid
flowchart LR
    subgraph JWT["JwtService"]
        Jwt_Generate["+GenerateToken(User)"]
    end

    subgraph CONFIG["Configuration"]
        IOptions["IOptions‹JwtSettings›<br/>───────────<br/>+Value"]
        JwtSettings["JwtSettings<br/>───────────<br/>+SecretKey<br/>+Issuer<br/>+Audience<br/>+ExpirationMinutes"]
    end

    subgraph JWTLIB["System.IdentityModel.Tokens.Jwt"]
        Claims["Claim[]"]
        SymmetricKey["SymmetricSecurityKey"]
        Credentials["SigningCredentials"]
        JwtToken["JwtSecurityToken"]
        TokenHandler["JwtSecurityTokenHandler"]
    end

    %% Config binding
    IOptions -->|.Value| JwtSettings
    Jwt_Generate -->|uses| JwtSettings

    %% JWT Library
    Jwt_Generate -->|creates| Claims
    Jwt_Generate -->|creates| SymmetricKey
    Jwt_Generate -->|creates| Credentials
    Jwt_Generate -->|creates| JwtToken
    Jwt_Generate -->|calls| TokenHandler
```

---

## GenerateToken Internal Flow

```mermaid
flowchart TD
    subgraph INPUT["Input"]
        User["User Entity<br/>───────────<br/>Id<br/>Email<br/>Username<br/>Role"]
    end

    subgraph STEP1["Step 1: Create Claims"]
        Claims["new Claim[]<br/>───────────<br/>ClaimTypes.NameIdentifier = user.Id<br/>ClaimTypes.Email = user.Email<br/>ClaimTypes.Name = user.Username<br/>ClaimTypes.Role = user.Role"]
    end

    subgraph STEP2["Step 2: Create Security Key"]
        GetBytes["Encoding.UTF8.GetBytes<br/>───────────<br/>_jwtSettings.SecretKey"]
        SymKey["new SymmetricSecurityKey<br/>───────────<br/>key bytes"]
    end

    subgraph STEP3["Step 3: Create Credentials"]
        SignCred["new SigningCredentials<br/>───────────<br/>key<br/>SecurityAlgorithms.HmacSha256"]
    end

    subgraph STEP4["Step 4: Create Token"]
        JwtToken["new JwtSecurityToken<br/>───────────<br/>issuer: _jwtSettings.Issuer<br/>audience: _jwtSettings.Audience<br/>claims: claims<br/>expires: DateTime.UtcNow + ExpirationMinutes<br/>signingCredentials: credentials"]
    end

    subgraph STEP5["Step 5: Serialize Token"]
        Handler["new JwtSecurityTokenHandler()"]
        WriteToken["handler.WriteToken(token)"]
    end

    subgraph OUTPUT["Output"]
        TokenString["JWT Token String<br/>───────────<br/>eyJhbGciOiJIUzI1NiIs..."]
    end

    User --> Claims
    Claims --> GetBytes
    GetBytes --> SymKey
    SymKey --> SignCred
    SignCred --> JwtToken
    JwtToken --> Handler
    Handler --> WriteToken
    WriteToken --> TokenString
```

---

## Options Pattern Binding

```mermaid
flowchart LR
    subgraph JSON["appsettings.json"]
        Section["JwtSettings<br/>───────────<br/>SecretKey<br/>Issuer<br/>Audience<br/>ExpirationMinutes"]
    end

    subgraph PROGRAM["Program.cs"]
        Configure["Configure‹JwtSettings›<br/>───────────<br/>GetSection JwtSettings"]
    end

    subgraph DICONTAINER["DI Container"]
        IOptions["IOptions‹JwtSettings›"]
    end

    subgraph JWTSERVICE["JwtService Constructor"]
        Constructor["JwtService<br/>───────────<br/>IOptions‹JwtSettings› jwtSettings"]
        Field["_jwtSettings = jwtSettings.Value"]
    end

    Section --> Configure
    Configure --> IOptions
    IOptions -->|injected| Constructor
    Constructor --> Field
```

---

## Dependency Injection

```mermaid
flowchart LR
    subgraph DI["Program.cs (DI Registration)"]
        ConfigReg["Configure‹JwtSettings›(GetSection)"]
        ServiceReg["AddScoped‹IJwtService, JwtService›()"]
    end

    subgraph CONSTRUCTOR["JwtService Constructor"]
        Params["JwtService(<br/>  IOptions‹JwtSettings› jwtSettings<br/>)"]
    end

    subgraph FIELD["Private Field"]
        JwtSettingsField["-_jwtSettings: JwtSettings"]
    end

    ConfigReg -.->|binds| IOptions2["IOptions‹JwtSettings›"]
    ServiceReg -.->|registers| CONSTRUCTOR
    IOptions2 -->|injected| Params
    Params -->|.Value| JwtSettingsField
```

---

## JWT Token Structure

```mermaid
flowchart LR
    subgraph TOKEN["JWT Token"]
        direction TB
        Header["Header<br/>───────────<br/>alg: HS256<br/>typ: JWT"]
        Payload["Payload<br/>───────────<br/>nameid: user.Id<br/>email: user.Email<br/>unique_name: user.Username<br/>role: user.Role<br/>exp: expiration<br/>iss: issuer<br/>aud: audience"]
        Signature["Signature<br/>───────────<br/>HMACSHA256(<br/>  base64(header) + . +<br/>  base64(payload),<br/>  secretKey<br/>)"]
    end

    Header --> Dot1["."]
    Dot1 --> Payload
    Payload --> Dot2["."]
    Dot2 --> Signature
```

---

## Call Flow Summary

```
AuthService
    │
    └── _jwtService.GenerateToken(User user)
            │
            ├── Step 1: Create Claims array
            │           └── NameIdentifier, Email, Name, Role
            │
            ├── Step 2: Create SymmetricSecurityKey
            │           └── From _jwtSettings.SecretKey
            │
            ├── Step 3: Create SigningCredentials
            │           └── HmacSha256 algorithm
            │
            ├── Step 4: Create JwtSecurityToken
            │           └── issuer, audience, claims, expires, credentials
            │
            ├── Step 5: Serialize with JwtSecurityTokenHandler
            │           └── WriteToken(token)
            │
            └── Return: JWT token string
```

---

## Legend

| Arrow | Meaning |
|-------|---------|
| `-->` | Method call / Uses / Creates |
| `-.->` | Implements / Registers / Binds |
