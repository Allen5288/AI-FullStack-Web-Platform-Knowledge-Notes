### **1. How do you handle cold starts in AWS Lambda?**

🧠 **Answer:**

> “Minimize cold start impact by keeping my functions small, reusing heavy resources outside the handler scope, and tuning memory/time settings. For critical APIs, I use provisioned concurrency.”
>

💡 **Best Practices:**

- Move DB clients, vector stores, and model loading **outside** the handler.
- Avoid initializing large dependencies **inside** `handler()`.
- Set **512MB+ memory** → helps reduce init time.
- Use **provisioned concurrency** for high-traffic endpoints.
- Optionally use `serverless-plugin-warmup`.

### **2. How do you manage environment configs and secrets across stages?**

🧠 **Answer:**

> “Store all secrets like API keys or DB URIs in AWS SSM Parameter Store, and load them via environment variables in the Serverless Framework. Each stage (dev, prod, clinic-a) has its own isolated config.”
>

💡 **Best Practices:**

- Use `serverless.yml` to inject values:

```yaml
environment:
  GEMINI_API_KEY: ${ssm:/ai/gemini/api-key}
```

- Use a naming convention: `/project/env/KEY_NAME`
- Don’t hardcode secrets in code or `.env` files
- Load config in `config.ts` file:

```
export const GEMINI_KEY = process.env.GEMINI_API_KEY!;
```

- Use stages like `dev`, `staging`, `clinic-a`, `prod`

### **3. How does API Gateway integrate with Lambda?**

💡 **Details:**

- **API Gateway** can be:
  - **HTTP API** (faster, cheaper) ✅
  - **REST API** (more features)
- Handles incoming requests → transforms → invokes Lambda

- Input mapping (headers, query, body) is auto-parsed by `middy` or `Fastify`
- Add CORS, throttling, auth (IAM, JWT) at API Gateway level

```yaml
functions:
  chat:
    handler: src/handlers/chat.handler
    events:
      - http:
          path: chat
          method: post
          cors: true
          private: true
```

### **4. How do you debug Lambda functions in production?**

🧠 **Answer:**

> “Use structured logging with user/session IDs, and Enable CloudWatch logs for every function. Track latency and error rates using X-Ray and custom metrics.”
>

💡 **Debugging Tools:**

- Use `console.log` with JSON structured logs
- Use correlation IDs (per user or request)
- `serverless logs -f <func> -t` to tail logs
- Add try/catch with clear error messages:

```jsx
try {
  await doSomething();
} catch (err) {
  log.error({ err, requestId }, "Chatbot failed");
  throw new InternalError("AI service failed");
}
```

- Use CloudWatch dashboards + X-Ray traces

### 5**: How do you write tests for your Node.js serverless APIs?**

🧠 **Answer:**

> “Use Jest for unit and integration testing. Each handler and service is tested in isolation using mocks, and I use AWS SDK v3 mock tools for testing external dependencies like DynamoDB or S3. For end-to-end tests, I simulate Lambda locally with serverless invoke local.”
>

💡 **Best Practices:**

- **Unit tests**: Services, utils — mock external calls
- **Integration tests**: Use local DynamoDB or test S3 bucket
- **Handler tests**: Test Lambda handler logic w/ mock events
- **Use AWS SDK mocks**: `aws-sdk-client-mock` for v3
- Simulate API Gateway input (event, context)

📁 Example Test Folder:

```
/tests
  /unit
    chatbotService.test.ts
  /integration
    chatHandler.test.ts

```

🔧 Tools:

- `jest`
- `supertest` (for Fastify-based handlers)
- `serverless invoke local`

---

### **6. How do you ensure good performance in your Node.js Lambda app?**

🧠 **Answer:**

> “Optimize cold start by moving all reusable objects outside the handler scope and minimizing bundle size. I also tune memory and timeout, avoid heavy dependencies, and use caching when possible.”
>

💡 **Performance Techniques:**

- Keep **handler thin** and logic modular
- Use **tree-shaking and bundlers** (e.g., esbuild, webpack)
- Avoid large packages (e.g., lodash → use lodash-es or native)
- Tune **memory size**: 512MB–1024MB is often faster
- Reduce dependencies — e.g., use AWS SDK v3 modular packages
- Use **TTL cache** (in-memory or Redis/S3/DynamoDB) for popular AI responses

📦 Example `serverless.yml` tuning:

```yaml
timeout: 30
memorySize: 768
```

---

### **7. How do you handle API versioning?**

🧠 **Answer:**

> “Version my APIs at the route level (e.g., /v1/chat), and sometimes by Lambda alias. For major changes, I deploy a separate version of the function so old clients can continue using v1 safely.”
>

💡 **Versioning Strategies:**

- URI versioning: `/v1/chat`, `/v2/chat`
- Optional: Use Lambda aliases (`v1`, `v2`) mapped via API Gateway stage variables
- Include version in OpenAPI docs

📁 Optional routing structure:

```
/handlers
  /v1
    chat.ts
  /v2
    chat.ts
```

---

### **8. What are some best practices for designing serverless APIs?**

🧠 **Answer:**

> “Design APIs with clear route separation, strict input validation, role-based access control, and consistent error handling. I keep each Lambda single-purpose, and use shared middlewares for auth and logging.”
>

💡 **API Design Best Practices:**

| Area | Practice |
| --- | --- |
| ✅ Routes | RESTful (e.g., `/appointments`, `/chat`) |
| ✅ Auth | Use JWT or Cognito authorizers |
| ✅ Input validation | Use `zod` or `class-validator` for schema validation |
| ✅ Errors | Consistent shape: `{ statusCode, message, type }` |
| ✅ Rate limit | API Gateway usage plans or Lambda throttling |
| ✅ Logging | Use correlation IDs, structured JSON logs |
| ✅ Monitoring | Track usage per endpoint / tenant |
| ✅ Throttling | Consider burst limits per user/clinic via API Gateway usage plans |

📦 Common Middleware (via `middy`):

- `httpErrorHandler`
- `httpJsonBodyParser`
- `validator`
- `cors`
- `logger`

📦 Input Validation Example:

```jsx
import { z } from 'zod';

const ChatSchema = z.object({
  message: z.string().min(1),
  userId: z.string().uuid()
});

function validate(input: any) {
  return ChatSchema.parse(input);
}
```
