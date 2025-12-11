---
name: Task
about: Technical implementation task derived from a story
title: "[Task][domain:][backend/frontend] "
labels: ''
assignees: ''
---

## 🔗 Parent Story

#issue_number

## 📋 Description

What needs to be implemented (one working unit = one commit).

## 🔧 Infrastructure Prerequisites

### Required Infrastructure (Framework Agnostic)

| Category | What's Needed | Why |
|----------|---------------|-----|
| e.g., Database | Relational DB with ORM | Store user data persistently |
| e.g., Authentication | Password hashing library | Secure credential storage |
| e.g., API Framework | REST API endpoint routing | Expose functionality to clients |

### Verification & Setup

- [ ] Check if infrastructure exists
- [ ] Install/configure if missing
- [ ] Verify working before implementation

### Framework-Specific Setup (if new)

| Infrastructure | Package/Tool | Configuration |
|----------------|--------------|---------------|
| e.g., ORM | Entity Framework Core | DbContext, Connection String |
| e.g., Password Hashing | BCrypt.Net | - |

## 📁 Affected Files

- `path/to/file`

## ✅ Definition of Done

- [ ] Implementation complete
- [ ] Code reviewed

## 📝 Technical Notes

### Architecture Patterns

| Pattern | What It Is | How It's Used Here |
|---------|-----------|-------------------|
| e.g., Repository | Abstracting data access behind an interface | TaskRepository hides database queries from service |
| e.g., Unit of Work | Grouping multiple operations into a single transaction | UnitOfWork.SaveChanges() commits all changes together |

### Design Patterns (GoF)

| Pattern | Category | How It's Used Here |
|---------|----------|-------------------|
| e.g., Singleton | Creational | DbContext shared across request lifecycle |
| e.g., Factory | Creational | ServiceFactory creates appropriate service instance |
| e.g., Observer | Behavioral | SignalR notifies clients when task changes |
| e.g., Strategy | Behavioral | Different validation strategies for different task types |

### Programming Concepts

| Concept | What It Is | How It's Used Here |
|---------|-----------|-------------------|
| e.g., Dependency Injection | Providing dependencies from outside rather than creating them inside | Service receives repository through constructor |
| e.g., Async/Await | Non-blocking asynchronous execution | Database calls don't block the thread |
| e.g., Middleware | Processing pipeline for requests | JWT validation before controller execution |
| e.g., Caching | Storing frequently accessed data in memory | Task details cached to reduce DB calls |

### Implementation Details

- Specific framework/language details here

## 🔗 Related Documentation

- [Link to relevant doc]
