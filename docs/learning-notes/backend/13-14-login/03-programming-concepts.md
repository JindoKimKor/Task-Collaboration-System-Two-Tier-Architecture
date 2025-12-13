# Programming Concepts Recap (Language Agnostic)

## Table of Contents

1. [Password Verification vs Hashing](#1-password-verification-vs-hashing)
2. [Authentication Flow](#2-authentication-flow)
3. [Exception-Based Control Flow](#3-exception-based-control-flow)
4. [Model Binding and Validation](#4-model-binding-and-validation)
5. [User Enumeration Prevention](#5-user-enumeration-prevention)
6. [Stateless Token Authentication](#6-stateless-token-authentication)
7. [Layered Architecture](#7-layered-architecture)

---

## 1. Password Verification vs Hashing

**Concept:** Hashing converts passwords to irreversible fixed-length strings. Verification checks if input matches stored hash without decryption.

```mermaid
flowchart TB
    subgraph HASH["Registration: Hash Password"]
        direction LR
        Plain1["plaintext password"]
        Salt1["random salt"]
        Algo1["bcrypt algorithm"]
        Hash1["$2a$12$salt...hash"]

        Plain1 --> Algo1
        Salt1 --> Algo1
        Algo1 --> Hash1
    end

    subgraph VERIFY["Login: Verify Password"]
        direction LR
        Plain2["plaintext password"]
        Stored["stored hash"]
        Algo2["bcrypt verify"]
        Result{{"true / false"}}

        Plain2 --> Algo2
        Stored --> Algo2
        Algo2 --> Result
    end
```

**Key Insight:**

| Operation | Input | Output | When Used |
|-----------|-------|--------|-----------|
| Hash | plain password | hash string | Registration |
| Verify | plain password + stored hash | boolean | Login |

**Why BCrypt:**
- Automatically generates and stores salt
- Configurable cost factor (slower = more secure)
- Designed for passwords (intentionally slow)

---

## 2. Authentication Flow

**Concept:** Credential-based authentication verifies identity, then issues a proof of authentication (token) for subsequent requests.

```mermaid
flowchart TB
    subgraph LOGIN["Login Phase"]
        direction TB
        L1["1. Receive credentials"]
        L2["2. Find user in database"]
        L3["3. Verify password against hash"]
        L4["4. Generate authentication token"]
        L5["5. Return token to client"]

        L1 --> L2 --> L3 --> L4 --> L5
    end

    subgraph SUBSEQUENT["Subsequent Requests"]
        direction TB
        S1["1. Client sends token in header"]
        S2["2. Server validates token signature"]
        S3["3. Server extracts user identity from token"]
        S4["4. Request processed as authenticated user"]

        S1 --> S2 --> S3 --> S4
    end

    LOGIN -->|"token stored by client"| SUBSEQUENT
```

**Key Insight:**

| Phase | Database Access | Token Operation |
|-------|-----------------|-----------------|
| Login | Yes (find user, verify password) | Generate new token |
| Subsequent | No (stateless) | Validate existing token |

---

## 3. Exception-Based Control Flow

**Concept:** Use exceptions to signal business rule violations, letting calling code handle them appropriately.

```mermaid
flowchart TB
    subgraph SERVICE["Service Layer"]
        direction TB
        Check{{"Validation"}}
        Success["Return result"]
        Fail["Throw exception"]

        Check -->|"valid"| Success
        Check -->|"invalid"| Fail
    end

    subgraph CONTROLLER["Controller Layer"]
        direction TB
        TryCatch["try { ... } catch { ... }"]
        Ok["Return 200 OK"]
        Error["Return 401/400/etc"]

        TryCatch -->|"success"| Ok
        TryCatch -->|"exception caught"| Error
    end

    SERVICE --> CONTROLLER
```

**Key Insight:**

| Exception Type | Business Meaning | HTTP Status |
|----------------|------------------|-------------|
| UnauthorizedAccessException | Invalid credentials | 401 Unauthorized |
| InvalidOperationException | Business rule violation | 400 Bad Request |
| ArgumentException | Invalid input | 400 Bad Request |

**Benefit:** Service layer remains HTTP-agnostic; controller translates business exceptions to HTTP responses.

---

## 4. Model Binding and Validation

**Concept:** Framework automatically converts incoming request data to typed objects and validates against defined rules before executing handler code.

```mermaid
flowchart TB
    subgraph BINDING["Model Binding Pipeline"]
        direction TB
        Raw["Raw HTTP Request<br/>─────────────<br/>JSON body"]
        Parser["JSON Parser<br/>─────────────<br/>Deserialize"]
        DTO["Typed Object<br/>─────────────<br/>LoginRequestDto"]
        Validator["Validation<br/>─────────────<br/>Check attributes"]
        Result{{"Valid?"}}

        Raw --> Parser --> DTO --> Validator --> Result
    end

    subgraph OUTCOMES["Outcomes"]
        Continue["Proceed to handler"]
        Reject["400 Bad Request<br/>with validation errors"]
    end

    Result -->|"yes"| Continue
    Result -->|"no"| Reject
```

**Key Insight:**

| Validation Stage | What Happens | Example |
|------------------|--------------|---------|
| Parsing | JSON to object | Malformed JSON → 400 |
| Binding | Map properties | Missing field → null |
| Validation | Check attributes | [Required] → error |

**Benefit:** Handler code only executes with valid, typed data.

---

## 5. User Enumeration Prevention

**Concept:** Return identical error messages for "user not found" and "wrong password" to prevent attackers from discovering valid usernames.

```mermaid
flowchart TB
    subgraph VULNERABLE["Vulnerable (Bad)"]
        direction TB
        V1{{"User exists?"}}
        V2["'User not found'"]
        V3{{"Password correct?"}}
        V4["'Wrong password'"]
        V5["Success"]

        V1 -->|"no"| V2
        V1 -->|"yes"| V3
        V3 -->|"no"| V4
        V3 -->|"yes"| V5
    end

    subgraph SECURE["Secure (Good)"]
        direction TB
        S1{{"User exists?"}}
        S2["'Invalid credentials'"]
        S3{{"Password correct?"}}
        S4["'Invalid credentials'"]
        S5["Success"]

        S1 -->|"no"| S2
        S1 -->|"yes"| S3
        S3 -->|"no"| S4
        S3 -->|"yes"| S5
    end
```

**Key Insight:**

| Scenario | Vulnerable Response | Secure Response |
|----------|-------------------|-----------------|
| User not found | "User not found" | "Invalid credentials" |
| Wrong password | "Wrong password" | "Invalid credentials" |
| Valid login | Success | Success |

**Attack Prevented:** Attacker cannot enumerate valid usernames by observing different error messages.

---

## 6. Stateless Token Authentication

**Concept:** Token contains all necessary information for authentication; server doesn't store session state.

```mermaid
flowchart LR
    subgraph STATEFUL["Stateful (Session-Based)"]
        direction TB
        SF1["Login → Server creates session"]
        SF2["Server stores session in memory/DB"]
        SF3["Client receives session ID"]
        SF4["Each request: server looks up session"]
        SF5["Problem: Server must store all sessions"]

        SF1 --> SF2 --> SF3 --> SF4 --> SF5
    end

    subgraph STATELESS["Stateless (Token-Based)"]
        direction TB
        SL1["Login → Server generates token"]
        SL2["Server stores nothing"]
        SL3["Client receives self-contained token"]
        SL4["Each request: server validates signature"]
        SL5["Benefit: No server-side storage"]

        SL1 --> SL2 --> SL3 --> SL4 --> SL5
    end

    STATEFUL ~~~ STATELESS
```

**Key Insight:**

| Aspect | Stateful | Stateless |
|--------|----------|-----------|
| Server storage | Sessions in memory/DB | None |
| Scaling | Complex (sticky sessions) | Simple (any server) |
| Revocation | Easy (delete session) | Hard (use short expiry) |
| Payload size | Small (session ID) | Larger (claims in token) |

---

## 7. Layered Architecture

**Concept:** Separate code into layers with distinct responsibilities; each layer only communicates with adjacent layers.

```mermaid
flowchart TB
    subgraph LAYERS["Application Layers"]
        direction TB

        subgraph PRESENTATION["Presentation Layer"]
            P1["Controller<br/>─────────────<br/>HTTP routing<br/>Request/Response<br/>Status codes"]
        end

        subgraph BUSINESS["Business Layer"]
            B1["Service<br/>─────────────<br/>Business logic<br/>Validation rules<br/>Flow coordination"]
        end

        subgraph DATA["Data Layer"]
            D1["Repository<br/>─────────────<br/>Database queries<br/>Data persistence<br/>Entity mapping"]
        end

        PRESENTATION -->|"calls"| BUSINESS
        BUSINESS -->|"calls"| DATA
    end
```

**Key Insight:**

| Layer | Knows About | Doesn't Know About |
|-------|-------------|-------------------|
| Controller | Service interface | Database, SQL |
| Service | Repository interface | HTTP, status codes |
| Repository | Database context | HTTP, business rules |

**Benefit:** Changes in one layer don't cascade to others; easier testing and maintenance.

---

## Summary Table

| Concept | Where Applied | Key Benefit |
|---------|---------------|-------------|
| **Password Verification** | AuthService.LoginAsync | Secure credential check |
| **Authentication Flow** | Login → Token → Requests | Stateless authentication |
| **Exception Control Flow** | Service → Controller | Clean error handling |
| **Model Binding** | Controller parameters | Automatic validation |
| **Enumeration Prevention** | Error messages | Security against enumeration |
| **Stateless Tokens** | JWT authentication | Scalable, no session storage |
| **Layered Architecture** | Controller/Service/Repo | Separation of concerns |

---

## Related Documentation

- [00-development-plan.md](./00-development-plan.md) - Implementation details
- [01-architecture-diagram.md](./01-architecture-diagram.md) - System architecture
- [02-design-patterns-and-solid.md](./02-design-patterns-and-solid.md) - Design patterns
