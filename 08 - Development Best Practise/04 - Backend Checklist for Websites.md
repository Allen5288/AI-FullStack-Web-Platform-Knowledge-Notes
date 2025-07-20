# 1. Backend Checklist for websites

## 🏛️ Architecture & Design

- [ ] **Microservices vs. Monolith decision is justified** (The chosen architecture suits the team size, project complexity, and long-term scalability needs. Best practice: Document the rationale in an Architecture Decision Record (ADR) based on team size, domain complexity, and scaling requirements.)
- [ ] **Clear separation of concerns is established** (The application is divided into distinct layers with specific responsibilities, like controllers, services, and data access. Best practice: Implement a layered architecture (e.g., Controller-Service-Repository) or a clean/hexagonal architecture.)
- [ ] **Asynchronous processing is used for long-running tasks** (Background jobs or message queues handle tasks like sending emails or processing files to avoid blocking user requests. Best practice: Use a message queue like RabbitMQ or a managed service like AWS SQS to decouple long-running jobs from the main request thread.)
- [ ] **Configuration is externalized from code** (Settings like API keys and database URLs are managed via environment variables or config files, not hardcoded. Best practice: Use environment variables (`.env` files for local development) and a secure secret management system for production.)

- [ ] **Stateless application design is preferred** (The application avoids storing client session data on the server, making it easier to scale horizontally. Best practice: Store session state in a shared cache like Redis or in a client-side token like a JWT (JSON Web Token).)

---

## 🌐 API Design

- [ ] **Consistent naming conventions are used for endpoints** (URL paths are predictable and resource-oriented, e.g., `/users` and `/users/{id}`. Best practice: Use plural nouns for resources and avoid verbs in URIs (e.g., `GET /users`, not `/getUsers`).)
- [ ] **Proper HTTP verbs are used (GET, POST, PUT, DELETE)** (API actions align with standard HTTP methods for intuitive and predictable behaviour. Best practice: Use `GET` for reads, `POST` for creates, `PUT`/`PATCH` for updates, and `DELETE` for removals.)
- [ ] **Versioning strategy is in place (e.g., /api/v1/)** (A plan exists for introducing breaking changes without disrupting existing clients. Best practice: Use URL path versioning (e.g., `/api/v1/`) as it's explicit and easy for clients and routing.)
- [ ] **Consistent response format is used for success and errors** (All API responses follow a predictable JSON structure, including a standard format for error messages. Best practice: Use a standard response envelope like `{ "data": { ... } }` for success and `{ "error": { "message": "..." } }` for failures.)
- [ ] **Pagination is implemented for list endpoints** (Endpoints that return lists of data have limits and offsets to prevent sending huge payloads. Best practice: Implement cursor-based pagination for performance on large datasets or offset/limit for simpler use cases.)
- [ ] **Sensitive data is not exposed in API responses** (Personally Identifiable Information (PII), passwords, and internal IDs are filtered out before sending data to the client. Best practice: Use Data Transfer Objects (DTOs) or serializers to explicitly map entity fields to API responses.)

---

## 🗄️ Database

- [ ] **Appropriate database type is chosen (SQL vs. NoSQL)** (The database technology is selected based on the data structure, query patterns, and consistency requirements. Best practice: Choose SQL for structured, relational data and NoSQL for unstructured, flexible data or massive scale.)
- [ ] **Indexes are used on frequently queried columns** (Database indexes are created to dramatically speed up read operations on large tables. Best practice: Use the `EXPLAIN` command to analyze slow queries and add indexes to foreign keys and columns used in `WHERE` clauses.)
- [ ] **Database migrations are managed with a tool** (Changes to the database schema are version-controlled and automated to ensure consistency across environments. Best practice: Use a dedicated library like `Flyway` (Java), `Alembic` (Python), or `Knex.js` (Node.js) to manage migrations as code.)
- [ ] **Connection pooling is implemented** (Database connections are reused to reduce the overhead of establishing a new connection for every request. Best practice: Use the connection pool built into your database driver or framework, tuning its size based on load.)
- [ ] **Backups and recovery plan are in place** (Regular, automated backups are taken, and the process for restoring them is documented and tested. Best practice: Use your cloud provider's automated backup service (e.g., AWS RDS snapshots) and periodically test the restore process.)
- [ ] **N+1 query problems are avoided** (Code is written to avoid fetching related data in separate, inefficient loops, using eager loading or batching instead. Best practice: Use your ORM's eager loading feature (e.g., `JOIN FETCH`) or a tool like DataLoader to batch requests.)

---

## 🛡️ Security

- [ ] **Authentication and Authorization are implemented** (The system correctly identifies who the user is (Authentication) and what they are allowed to do (Authorization). Best practice: Implement a standard like OAuth 2.0 for authentication and manage permissions using Role-Based Access Control (RBAC).)
- [ ] **Passwords are hashed using a strong, salted algorithm** (User passwords are never stored in plaintext and use a modern algorithm like Argon2 or bcrypt. Best practice: Use a standard, well-vetted library for your language (e.g., `bcrypt` for Node.js) and never create your own hashing algorithm.)
- [ ] **Protection against OWASP Top 10 is in place** (Measures are taken to prevent common vulnerabilities like SQL Injection, Cross-Site Scripting (XSS), and Cross-Site Request Forgery (CSRF). Best practice: Use an ORM to prevent SQL injection, validate all input, and set security-focused HTTP headers.)
- [ ] **API rate limiting and throttling are implemented** (The system prevents abuse by limiting how many requests a client can make in a given time. Best practice: Implement rate limiting at the API gateway or with a middleware library using an algorithm like the token bucket.)
- [ ] **Secrets and credentials are managed securely** (API keys, passwords, and certificates are stored in a secure system like Vault or AWS Secrets Manager, not in code. Best practice: Inject secrets as environment variables into your application at runtime from a secure vault.)
- [ ] **Input data is always validated and sanitized** (The application never trusts user-provided data and rigorously checks it for correctness and malicious content. Best practice: Use a schema validation library (e.g., Joi, Zod, Pydantic) at the controller/entry point of your application.)
- [ ] **Dependencies are scanned for known vulnerabilities** (A tool like Snyk or Dependabot is used to regularly check third-party libraries for security issues. Best practice: Integrate a scanner like Snyk, `npm audit`, or GitHub's Dependabot into your CI/CD pipeline to fail builds on critical vulnerabilities.)

---

## 🚀 Performance & Scalability

- [ ] **Caching strategy is implemented (e.g., Redis, Memcached)** (Frequently accessed or slow-to-generate data is stored in a fast, in-memory cache to reduce database load. Best practice: Implement a cache-aside pattern with a tool like Redis for data that is read-heavy but not frequently updated.)
- [ ] **Load balancing is used for multiple instances** (Incoming traffic is distributed across several application servers to prevent any single server from being overwhelmed. Best practice: Use a managed load balancer from your cloud provider (e.g., AWS ELB, Google Cloud Load Balancer).)
- [ ] **Performance load testing has been conducted** (The application has been tested with tools like k6 or JMeter to identify and fix performance bottlenecks before they impact users. Best practice: Create test scripts for critical user flows and run them as part of your CI/CD pipeline before a release.)
- [ ] **Database query optimization is performed** (Slow queries have been identified (e.g., via `EXPLAIN` plans) and optimized for better performance. Best practice: Enable slow query logging in your database and regularly review the logs to identify and fix inefficient queries.)

---

## ✨ Code Quality & Maintainability

- [ ] **A consistent coding style is enforced by a linter/formatter** (Automated tools ensure all code follows a standard format, improving readability and reducing debate. Best practice: Integrate a linter (e.g., ESLint) and formatter (e.g., Prettier) into your IDE and CI pipeline.)
- [ ] **Code is organized into logical modules/packages** (The codebase is structured in a way that is easy to navigate, understand, and maintain. Best practice: Group code by feature or domain rather than by type (e.g., a `users` folder with controllers and services, not separate `controllers` and `services` folders).)
- [ ] **Error handling is robust and consistent** (The application gracefully handles unexpected errors without crashing and provides useful, structured logs. Best practice: Use a global error handling middleware to catch all exceptions and return a consistent error response.)
- [ ] **Code reviews are mandatory for all changes** (Another developer reviews code before it is merged to improve quality, catch bugs, and share knowledge. Best practice: Use pull/merge requests in your Git workflow and require at least one approval before merging.)

---

## ✅ Testing

- [ ] **Unit tests cover critical business logic** (Individual functions and classes are tested in isolation to ensure they work correctly. Best practice: Aim for high coverage on service/logic layers, mocking external dependencies like databases.)
- [ ] **Integration tests cover interactions between components** (Tests verify that different parts of the system (e.g., the API and the database) work together as expected. Best practice: Write integration tests for API endpoints that run against a real test database.)
- [ ] **Test coverage is measured and meets a minimum threshold** (A tool reports the percentage of code covered by tests, aiming for a healthy project-defined target. Best practice: Integrate a coverage tool (e.g., JaCoCo, Jest coverage) into your CI pipeline and set a reasonable threshold (e.g., 80%).)
- [ ] **CI pipeline runs all tests on every commit or pull request** (Tests are automatically executed in the development pipeline to catch regressions early. Best practice: Configure your CI service (e.g., GitHub Actions, Jenkins) to run your full test suite on every pull request.)

---

## 📈 Logging & Monitoring

- [ ] **Structured logging is used (e.g., JSON format)** (Logs are written in a machine-readable format to make them easy to search, filter, and analyze in a logging platform. Best practice: Use a logging library that supports JSON output and send logs to a centralized service like Datadog or ELK Stack.)
- [ ] **Logs include a request/correlation ID** (All log entries for a single API request can be easily grouped together for effective debugging. Best practice: Generate a unique ID at the start of each request and pass it to all subsequent function calls and log statements.)
- [ ] **Key application metrics are monitored** (A dashboard tracks real-time health indicators like request rate, error rate, and response latency. Best practice: Use a monitoring service like Prometheus or Datadog to collect and visualize key metrics from your application.)
- [ ] **Alerting is set up for critical errors and performance issues** (The on-call team is automatically notified via Slack, PagerDuty, etc., when something goes wrong. Best practice: Set up alerts on high error rates (e.g., >1%) and high latency (e.g., p95 > 500ms).)
- [ ] **Health check endpoint is available (e.g., /health)** (A simple endpoint exists for load balancers and monitoring systems to confirm the application is running and healthy. Best practice: Create a `/health` endpoint that returns a `200 OK` status and can check connections to downstream services.)

---

## 🛠️ Deployment & Operations (DevOps)

- [ ] **Infrastructure is managed as code (e.g., Terraform, CloudFormation)** (The server environment is defined in version-controlled code for consistency and reproducibility. Best practice: Use Terraform or your cloud provider's native solution to define and manage all infrastructure resources.)
- [ ] **A CI/CD pipeline automates builds, tests, and deployments** (The process of getting code from a developer's machine to production is fully automated and reliable. Best practice: Use a tool like GitHub Actions or Jenkins to create a pipeline that automatically builds, tests, and deploys code upon merging.)
- [ ] **Zero-downtime deployment strategy is used (e.g., blue-green)** (New versions of the application can be released without any interruption of service for users. Best practice: Implement a blue-green or canary deployment strategy managed by your container orchestrator or load balancer.)
- [ ] **Application is containerized (e.g., Docker)** (The application and its dependencies are packaged into a standard unit for consistent development and deployment. Best practice: Write a multi-stage `Dockerfile` to create a small, optimized production image.)
- [ ] **Rollback plan is in place and tested** (A clear, tested procedure exists to quickly revert to a previous stable version if a deployment fails. Best practice: Automate the rollback process within your CI/CD pipeline, allowing for a one-click revert.)

---

## 📖 Documentation

- [ ] **API documentation is generated and up-to-date (e.g., OpenAPI/Swagger)** (Clear, interactive documentation exists for all API endpoints, detailing requests, responses, and authentication. Best practice: Generate OpenAPI specs from your code comments or controllers and host them using a tool like Swagger UI.)
- [ ] **README file contains clear setup and run instructions** (The project's main README explains how a new developer can get the application running on their local machine. Best practice: Include sections for prerequisites, installation, running the app, and running tests.)
- [ ] **Architecture and key design decisions are documented** (High-level documentation explains the "why" behind the system's structure for future reference. Best practice: Maintain a collection of lightweight Architecture Decision Records (ADRs) in the repository.)
