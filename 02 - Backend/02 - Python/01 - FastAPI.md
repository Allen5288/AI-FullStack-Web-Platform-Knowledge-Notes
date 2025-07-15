# **1. How structure a FastAPI service for a new feature?"**

- start with a clean folder layout — typically with `api/routes` for routing, `models` for Pydantic schemas, `services` for business logic, and `core` for shared configs like settings and logging.
- Each feature has its own router file, which is then included in the main app via `include_router`, allowing for clear API versioning and modular growth.
- I define request and response schemas using Pydantic to ensure strong data validation and automatic documentation via OpenAPI.
- The route functions stay lean — they handle HTTP interface concerns and delegate actual logic to service layers, which improves testability and clarity.
- For performance and scalability, I use async functions and async database clients where appropriate, especially when dealing with I/O-bound operations. background user could be used, chche some reponses when needed with redis, all api endpoint design with stateless and retry-safe,
- I apply dependency injection via FastAPI’s `Depends`, such as injecting database sessions or user identity, and use custom exception handling middleware to centralize error management.
- For security: using jwt and OAuth, secure endpoints with depends, role based access checks inside services, and with token refresh strategy
- For error handler, using exception handler, all errors return a consistent JSON format with code, message, and traceID,
- I integrate logging, tracing, and metrics early to support observability, and test routes using FastAPI’s built-in TestClient with mocked dependencies.

# **2. Common, recommended packages and middleware** used for

## ✅ Commonly Used **Packages** in FastAPI Projects

### 🧰 Core FastAPI & Dependencies

| Package | Purpose |
| --- | --- |
| `fastapi` | Web framework itself |
| `uvicorn` | ASGI server for running FastAPI |
| `pydantic` | Data validation & serialization |
| `python-dotenv` | Load `.env` files for config |
| `httpx` or `aiohttp` | Async HTTP requests (e.g., to LLM APIs) |

---

### 💾 Database & ORM

| Package | Purpose |
| --- | --- |
| `sqlalchemy` | Popular ORM (Object Relational Mapper) (sync or async), Lets you define DB tables as Python classes (models), then query using Python syntax |
| `databases` | Async DB client wrapper (use with SQLAlchemy) |
| `asyncpg` | Fast PostgreSQL driver |
| `motor` | Async MongoDB driver |
| `alembic` | DB migrations with SQLAlchemy |
| `redis` or `aioredis` | Caching, sessions, rate-limiting |

---

### 🔐 Security & Auth

| Package | Purpose |
| --- | --- |
| `passlib[bcrypt]` | Password hashing |
| `python-jose` | JWT handling |
| `fastapi.security` | OAuth2 + JWT helpers |
| `Authlib` or `firebase-admin` | OAuth/OpenID Connect if needed |

---

### 📊 Observability & Monitoring

| Package | Purpose |
| --- | --- |
| `loguru` or `structlog` | Advanced logging |
| `sentry-sdk` | Error monitoring |
| `prometheus_fastapi_instrumentator` | Metrics export for Prometheus |
| `opentelemetry-instrumentation-fastapi` | Distributed tracing (OpenTelemetry) |

---

### 🧠 AI / LLM Integration

| Package | Purpose |
| --- | --- |
| `openai` | LLM integration |
| `langchain` | Advanced RAG, chains, prompt orchestration |
| `faiss` or `chromadb` | Vector search for embeddings |
| `tiktoken` | Token counting for cost control |

---

### 🔁 Background Tasks / Async Jobs

| Package | Purpose |
| --- | --- |
| `celery` | Task queue (paired with Redis/RabbitMQ) |
| `fastapi.BackgroundTasks` | Lightweight async jobs in FastAPI |
| `rq` | Simple Redis-based job queue |
| `apscheduler` | Scheduled jobs (cron-style) |

---

## ✅ Commonly Used **Middleware** in FastAPI

Middleware in FastAPI is used to hook into the request/response cycle globally.

| Middleware Example | What It Does |
| --- | --- |
| **CORS** (`CORSMiddleware`) | Allow cross-origin requests |
| **GZipMiddleware** | Compress large responses |
| **HTTPSRedirectMiddleware** | Force HTTPS |
| **TrustedHostMiddleware** | Restrict allowed host headers |
| **Custom Auth Middleware** | Inject user context from JWT, headers, or sessions |
| **Logging Middleware** | Log incoming requests, execution time, user agent, etc. |
| **Rate Limiting Middleware** (e.g., using Redis) | Control request volume |
| **Error Handling Middleware** | Catch uncaught exceptions, format error responses |
| **Metrics Middleware** (e.g., Prometheus) | Collect app performance metrics |

---

# 3. Test

---

## ✅ OVERVIEW: Testing Types

| Test Type | Purpose | Scope | Tools |
| --- | --- | --- | --- |
| **Unit Test** | Test isolated functions | Single function/module | `pytest`, `unittest` |
| **Integration Test** | Test components working together | API ↔ DB ↔ external services | `TestClient`, `pytest`, `FastAPI lifespans` |
| **End-to-End (E2E)** | Simulate full user journey | Backend + Frontend or API sequence | `Cypress`, `Playwright`, Postman |

---

## 🧪 UNIT TESTING — Best Practices & Examples

✅ Goals:

- Test individual logic: helpers, services, utils
- Fast, reliable, deterministic
- Mock external calls (e.g., OpenAI, DB)

🧰 Tools:

- `pytest` + `pytest-mock`
- `unittest.mock` for patching
- Assertions, fixtures

📌 Example: Testing business logic

```python
# app/services/ai_service.py
def classify_text(text: str) -> str:
    if "urgent" in text.lower():
        return "high"
    return "normal"

```

```python
# tests/test_ai_service.py
from app.services.ai_service import classify_text

def test_classify_urgent():
    assert classify_text("This is URGENT") == "high"

```

---

## 🔗 INTEGRATION TESTING — API + DB + Services

✅ Goals:

- Test API route + DB + service flow
- Validate Pydantic validation, error handling
- Optional: use in-memory or test DB

🧰 Tools:

- `TestClient` (from FastAPI)
- `pytest`, `httpx` (for async)
- Fixtures for DB/session mocking
- Use `Testcontainers`, `SQLite` or separate test database

📌 Example: API + DB

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_user():
    response = client.post("/api/users/", json={"email": "test@example.com"})
    assert response.status_code == 201
    assert "id" in response.json()

```

You can mock DB with `pytest-mock` or `dependency_overrides`:

```python
from fastapi import Depends

def override_get_db():
    yield FakeTestDB()

app.dependency_overrides[get_db] = override_get_db

```

---

## 🔍 E2E TESTING — Simulate User Journeys

✅ Goals:

- Test the full flow from request → DB → AI → response
- Validate real-world behavior: error flows, UX impact
- Protect against regression during refactoring

🧰 Tools:

- `Cypress` or `Playwright` (for frontend + API combo)
- `Postman/Newman` for API sequence tests
- `httpx.AsyncClient` for async E2E from Python

📌 Example with `httpx.AsyncClient` (for FastAPI)

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_register_user():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.post("/register", json={"email": "a@a.com"})
    assert resp.status_code == 201

```

---

## ✅ Best Practices Summary

| Area | Best Practice |
| --- | --- |
| ✅ Test Isolation | Unit tests should never hit real DBs or APIs |
| ✅ Coverage | Focus on critical logic paths and edge cases |
| ✅ Fixtures | Use `pytest` fixtures for shared setup/teardown |
| ✅ CI Integration | Run tests in GitHub Actions or similar |
| ✅ Mocking | Use `unittest.mock` to isolate dependencies |
| ✅ Fast Tests | Keep tests under 100ms where possible |
| ✅ Named Tests | Descriptive test names help debugging |
| ✅ Error Scenarios | Test failures: invalid input, exceptions, timeouts |
| ✅ LLMs | Always mock OpenAI/Claude APIs in tests |
| ✅ Test Before Release | Integration + E2E before production deploys |
