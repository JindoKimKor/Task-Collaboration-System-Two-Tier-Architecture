# Architecture Diagram - Task #12

## Overview

This document shows where JWT Middleware fits in the overall application architecture.

---

## System Architecture with JWT Middleware

```mermaid
flowchart TB
    subgraph CLIENT["Client (Browser)"]
        React["React App<br/>─────────────<br/>Stores JWT in localStorage"]
    end

    subgraph MIDDLEWARE["ASP.NET Core Middleware Pipeline"]
        direction TB
        HTTPS["UseHttpsRedirection()"]
        CORS["UseCors()"]
        AUTH["UseAuthentication()<br/>─────────────<br/>JWT Middleware<br/>(Task #12)"]
        AUTHZ["UseAuthorization()"]
    end

    subgraph API["Controllers"]
        AuthCtrl["AuthController<br/>─────────────<br/>/api/auth/register<br/>/api/auth/login"]
        TaskCtrl["TasksController<br/>─────────────<br/>[Authorize]<br/>/api/tasks"]
    end

    subgraph SERVICES["Service Layer"]
        AuthSvc["AuthService"]
        JwtSvc["JwtService"]
    end

    React -->|"HTTP Request<br/>+ Authorization header"| HTTPS
    HTTPS --> CORS
    CORS --> AUTH
    AUTH -->|"Valid token"| AUTHZ
    AUTH -->|"Invalid token"| React
    AUTHZ --> API
    API --> SERVICES
    JwtSvc -->|"Generate token"| AuthSvc
```

---

## Request Flow: Authenticated vs Unauthenticated

```mermaid
flowchart LR
    subgraph UNAUTH["Unauthenticated Request"]
        direction TB
        U1["POST /api/auth/login<br/>─────────────<br/>No Authorization header"]
        U2["JWT Middleware<br/>─────────────<br/>Skips validation<br/>(no token present)"]
        U3["AuthController<br/>─────────────<br/>No [Authorize]<br/>Allows request"]

        U1 --> U2 --> U3
    end

    subgraph AUTH["Authenticated Request"]
        direction TB
        A1["GET /api/tasks<br/>─────────────<br/>Authorization: Bearer eyJ..."]
        A2["JWT Middleware<br/>─────────────<br/>Validates token<br/>Sets HttpContext.User"]
        A3["TasksController<br/>─────────────<br/>[Authorize]<br/>Checks User.Identity"]

        A1 --> A2 --> A3
    end
```

---

## JWT Middleware Position in Pipeline

```mermaid
flowchart TB
    subgraph PIPELINE["Middleware Pipeline Order"]
        direction TB

        subgraph EARLY["Early Middleware"]
            P1["1. UseHttpsRedirection()<br/>─────────────<br/>Redirect HTTP to HTTPS"]
            P2["2. UseCors()<br/>─────────────<br/>Handle CORS preflight"]
        end

        subgraph SECURITY["Security Middleware"]
            P3["3. UseAuthentication()<br/>─────────────<br/>✅ JWT Middleware<br/>Validate tokens"]
            P4["4. UseAuthorization()<br/>─────────────<br/>Check [Authorize] attributes"]
        end

        subgraph ROUTING["Routing"]
            P5["5. MapControllers()<br/>─────────────<br/>Route to controller actions"]
        end

        EARLY --> SECURITY --> ROUTING
    end
```

---

## Before vs After Task #12

```mermaid
flowchart LR
    subgraph BEFORE["Before Task #12"]
        direction TB
        B1["Tokens generated ✅"]
        B2["Tokens returned to client ✅"]
        B3["Tokens NOT validated ❌"]
        B4["[Authorize] doesn't work ❌"]
    end

    subgraph AFTER["After Task #12"]
        direction TB
        A1["Tokens generated ✅"]
        A2["Tokens returned to client ✅"]
        A3["Tokens validated ✅"]
        A4["[Authorize] works ✅"]
    end

    BEFORE -->|"AddAuthentication()<br/>UseAuthentication()"| AFTER
```

---

## Component Interaction

```mermaid
flowchart TB
    subgraph CONFIG["Configuration"]
        AppSettings["appsettings.json<br/>─────────────<br/>JwtSettings {<br/>  SecretKey,<br/>  Issuer,<br/>  Audience,<br/>  ExpirationMinutes<br/>}"]
    end

    subgraph REGISTRATION["Service Registration (Program.cs)"]
        Configure["Configure&lt;JwtSettings&gt;()"]
        AddAuth["AddAuthentication()"]
        AddJwt["AddJwtBearer()"]
    end

    subgraph RUNTIME["Runtime"]
        Middleware["JWT Middleware<br/>─────────────<br/>TokenValidationParameters"]
        HttpContext["HttpContext.User<br/>─────────────<br/>Claims from token"]
    end

    AppSettings --> Configure
    Configure --> AddAuth
    AddAuth --> AddJwt
    AddJwt -->|"configures"| Middleware
    Middleware -->|"populates"| HttpContext
```

---

## Related Documentation

- [00-development-plan.md](./00-development-plan.md) - Implementation details
- [02-design-patterns-and-solid.md](./02-design-patterns-and-solid.md) - Design patterns used
- [03-programming-concepts.md](./03-programming-concepts.md) - Programming concepts
