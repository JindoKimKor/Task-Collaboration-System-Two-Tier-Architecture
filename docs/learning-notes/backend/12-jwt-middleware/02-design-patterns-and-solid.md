# Design Patterns and SOLID Principles - Task #12

## Overview

This document analyzes the design patterns and SOLID principles applied in the JWT Middleware implementation.

---

## Design Patterns

### 1. Chain of Responsibility Pattern

```mermaid
flowchart LR
    subgraph CHAIN["Middleware Pipeline = Chain of Responsibility"]
        direction LR
        H1["HTTPS<br/>Handler"]
        H2["CORS<br/>Handler"]
        H3["Authentication<br/>Handler"]
        H4["Authorization<br/>Handler"]
        H5["Controller<br/>Handler"]

        H1 -->|"next()"| H2
        H2 -->|"next()"| H3
        H3 -->|"next()"| H4
        H4 -->|"next()"| H5
    end

    subgraph REQUEST["Request"]
        R1["HTTP Request"]
    end

    R1 --> H1
```

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Decouples request sender from receivers |
| **Logic** | Each middleware decides to handle or pass to next |
| **Runtime** | Request flows through chain until handled or completed |
| **Changes when** | Add/remove middleware in pipeline |
| **Does NOT do** | Guarantee order (developer must configure correctly) |

---

### 2. Options Pattern

```mermaid
flowchart TB
    subgraph OPTIONS["Options Pattern"]
        direction TB

        subgraph CONFIG["Configuration Source"]
            JSON["appsettings.json<br/>─────────────<br/>JwtSettings section"]
        end

        subgraph BINDING["Binding"]
            Configure["Configure&lt;JwtSettings&gt;()<br/>─────────────<br/>Binds JSON to class"]
        end

        subgraph INJECTION["Injection"]
            IOptions["IOptions&lt;JwtSettings&gt;<br/>─────────────<br/>Injected into services"]
        end

        subgraph USAGE["Usage"]
            Service["JwtService<br/>JWT Middleware<br/>─────────────<br/>Access via .Value"]
        end

        CONFIG --> BINDING --> INJECTION --> USAGE
    end
```

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Strongly-typed configuration access |
| **Logic** | Binds JSON sections to C# classes |
| **Runtime** | Configuration values available via DI |
| **Changes when** | appsettings.json changes (with reload support) |
| **Does NOT do** | Validate configuration at startup (use IValidateOptions for that) |

---

### 3. Strategy Pattern (in TokenValidation)

```mermaid
flowchart TB
    subgraph STRATEGY["Strategy Pattern in JWT Validation"]
        direction TB

        subgraph CONTEXT["Context: JWT Middleware"]
            Middleware["JwtBearerHandler<br/>─────────────<br/>Uses validation strategies"]
        end

        subgraph STRATEGIES["Validation Strategies"]
            S1["IssuerValidator<br/>─────────────<br/>Validates iss claim"]
            S2["AudienceValidator<br/>─────────────<br/>Validates aud claim"]
            S3["LifetimeValidator<br/>─────────────<br/>Checks exp claim"]
            S4["SignatureValidator<br/>─────────────<br/>Verifies signature"]
        end

        Middleware --> S1
        Middleware --> S2
        Middleware --> S3
        Middleware --> S4
    end
```

| Aspect | Description |
|--------|-------------|
| **Responsibility** | Allows swappable validation algorithms |
| **Logic** | Each validator is independent strategy |
| **Runtime** | All strategies run; all must pass |
| **Changes when** | Custom validators added via TokenValidationParameters |
| **Does NOT do** | Short-circuit on first failure (all are checked) |

---

## SOLID Principles

### Single Responsibility Principle (SRP)

```mermaid
flowchart TB
    subgraph SRP["Single Responsibility"]
        direction LR

        subgraph MIDDLEWARE["JWT Middleware"]
            M1["Only validates tokens<br/>Does NOT generate them"]
        end

        subgraph JWTSERVICE["JwtService"]
            M2["Only generates tokens<br/>Does NOT validate them"]
        end

        subgraph AUTHSERVICE["AuthService"]
            M3["Only handles auth logic<br/>Delegates token work"]
        end
    end
```

| Component | Single Responsibility |
|-----------|----------------------|
| JWT Middleware | Validate incoming tokens |
| JwtService | Generate new tokens |
| AuthService | Coordinate authentication flow |
| TokenValidationParameters | Configure validation rules |

---

### Open/Closed Principle (OCP)

```mermaid
flowchart TB
    subgraph OCP["Open for Extension, Closed for Modification"]
        direction TB

        subgraph CLOSED["Closed (Don't Modify)"]
            Core["JwtBearerHandler<br/>─────────────<br/>Core middleware logic"]
        end

        subgraph OPEN["Open (Extend via Configuration)"]
            Params["TokenValidationParameters<br/>─────────────<br/>Add custom validators"]
            Events["JwtBearerEvents<br/>─────────────<br/>Hook into events"]
        end

        Core -.->|"configured by"| Params
        Core -.->|"extended by"| Events
    end
```

| Extension Point | How to Extend |
|-----------------|---------------|
| Custom validation | Add IssuerValidator delegate |
| Event hooks | Configure OnAuthenticationFailed, OnTokenValidated |
| Custom claims | Use ClaimsTransformation |

---

### Dependency Inversion Principle (DIP)

```mermaid
flowchart TB
    subgraph DIP["Dependency Inversion"]
        direction TB

        subgraph HIGHLEVEL["High-Level (Middleware)"]
            Middleware["JWT Middleware<br/>─────────────<br/>Depends on abstractions"]
        end

        subgraph ABSTRACTIONS["Abstractions"]
            IOptions["IOptions&lt;JwtSettings&gt;"]
            IConfig["IConfiguration"]
        end

        subgraph LOWLEVEL["Low-Level (Implementations)"]
            Options["OptionsManager&lt;JwtSettings&gt;"]
            Config["ConfigurationRoot"]
        end

        Middleware -->|"depends on"| ABSTRACTIONS
        LOWLEVEL -->|"implements"| ABSTRACTIONS
    end
```

| Abstraction | Implementation |
|-------------|----------------|
| IOptions<JwtSettings> | OptionsManager<JwtSettings> |
| IConfiguration | ConfigurationRoot |
| SecurityKey | SymmetricSecurityKey |

---

## Pattern Summary

| Pattern | Where Applied | Benefit |
|---------|--------------|---------|
| Chain of Responsibility | Middleware Pipeline | Decoupled request processing |
| Options Pattern | JwtSettings configuration | Strongly-typed settings |
| Strategy Pattern | Token validation | Swappable validators |

| SOLID Principle | How Applied |
|-----------------|-------------|
| SRP | Each component has one job |
| OCP | Extend via configuration, not modification |
| DIP | Depend on IOptions, not concrete settings |

---

## Related Documentation

- [00-development-plan.md](./00-development-plan.md) - Implementation details
- [01-architecture-diagram.md](./01-architecture-diagram.md) - System architecture
- [03-programming-concepts.md](./03-programming-concepts.md) - Programming concepts
